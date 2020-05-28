const fetch = require("node-fetch");
const { m3uParser } = require("./utils");
const Duplexify = require('duplexify');

SoundCloudDl = function (searchParser) {
    this.serachParser = searchParser;
    this.urlBase = "https://soundcloud.com/";
    this.apiV2Url = "https://api-v2.soundcloud.com";
};

SoundCloudDl.prototype = Object.create({}, {
    _getBundels: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function () {
            const homePage = await fetch(this.urlBase);
            const content = await homePage.text();
            const pattern = /(?<assets>https:\/\/a-v2.sndcdn.com\/assets\/.*?\.js)/g;
            const match = content.match(pattern);
            return Array.from(match);
        }
    },

    _getClientId: {
        enumerable: false,
        value: async function (a) {
            const bundles = await this._getBundels();
            const pattern = /(?<=client_id(=|:)"?)(?:[a-z0-9A-Z]{10,})/;
            const calls = [];
            for (let bundle of bundles) {
                calls.push(fetch(bundle).then(res => res.text()).then(content => {
                    const match = content.match(pattern);
                    if (!match) {
                        throw new Error("not found");
                    }
                    return match[0];
                }))
            }
            const results = await Promise.allSettled(calls);
            return results.filter(result => result.status === "fulfilled").map(result => result.value);
        }
    },

    getClientId: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function () {
            if (!this._clientId) {
                const ids = await this._getClientId();

                this._clientId = ids[0]
            }
            return this._clientId;
        }
    },

    resovleUrl: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function (url) {
            const clientId = await this.getClientId();
            const callUrl = this.apiV2Url + `/resolve?url=${url}&client_id=${clientId}`;
            const response = await fetch(callUrl);
            console.log(response)
        }
    },

    search: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function (query, limit = 10, parser = this.serachParser) {
            if (!parser) {
                parser = item => item;
            }
            const clientId = await this.getClientId();
            const url = `${this.apiV2Url}/search?q=${query}&limit=${limit}&client_id=${clientId}`;
            const result = await fetch(url);
            if (result.status > 200) {
                return [];
            }
            let json = await result.json();
            console.log(json);
            return json.collection
                .filter(item => item.kind === "track")
                .map(item => parser(item));
        }
    },

    download: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function (id) {
            try {
                if (!id) throw new Error("Function expect id parametr")
                const clientId = await this.getClientId();
                const trackUrl = `https://api-v2.soundcloud.com/tracks/${id}?client_id=${clientId}&app_version=1590494738`
                const permalink = await fetch(trackUrl).then(res => res.json()).then(json => json.permalink_url);
                const pageContent = await fetch(permalink).then(res => res.text());
                const pattern = /https:\/\/api-v2\.soundcloud\.com\/media\/soundcloud:tracks:\d+\/[^\/]+\//;
                const match = pageContent.match(pattern)
                if (!match) throw new Error("Unable to find hsl url");
                const hslUrl = [
                    match[0] + "stream/hls?client_id=" + clientId, 
                    match[0] + "preview/hls?client_id=" + clientId
                ];
                let url = null;
                for (let i = 0; i < hslUrl.length && !url; i++) {
                    url = await fetch(hslUrl[i]).then(res => res.json()).then(json => json.url);
                }
                if (!url) throw new Error("Can't find playlist url");
                const m3u = await fetch(url).then(res => res.text()).then(playlist => m3uParser(playlist));
                const duplex = new Duplexify();
                const chunks = m3u.map(chunk => fetch(chunk.url));
                const pipeChunk = async index => {
                    //console.log(index)
                    if (index > chunks.length - 1) {
                        return;
                    }
                    const res = await chunks[index]
                    res.body.on("data", chunk => {
                       // console.log(duplex.destroyed)
                        if(duplex.destroyed) return;
                        duplex.write(chunk)

                    })
                    res.body.on("end", () => pipeChunk(++index))
                }
                pipeChunk(0);
                return duplex;
            } catch (err) {
                console.log(err);
                return null;
            }
        }
    }
})

module.exports = SoundCloudDl