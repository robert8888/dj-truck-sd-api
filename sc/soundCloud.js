const fetch = require("node-fetch");
const { m3uParser, fileSize, chunkStart } = require("./utils");
const Duplexify = require('duplexify');

SoundCloudDl = function (searchParser) {
    this.serachParser = searchParser;
    this.urlBase = "https://soundcloud.com/";
    this.apiV2Url = "https://api-v2.soundcloud.com";

    this._m3uCache = new Set();
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


    //to do finish this 
    resolve: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function (id, url) {
            const clientId = await this.getClientId();
            let json;
            if(id){
                const trackUrl = this.apiV2Url + `/tracks/${id}?client_id=${clientId}&app_version=1590494738`
                json = await fetch(trackUrl).then(res => res.json())
                
            } else if(url){
                const callUrl = this.apiV2Url + `/resolve?url=${url}&client_id=${clientId}`;
                json = await fetch(callUrl).then(res => res.json());    
            }
            //console.log(json)
            return json
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
            return json.collection
                .filter(item => item.kind === "track")
                .map(item => parser(item));
        }
    },

    _fetchM3u : {
        enumerable: false,
        configurable: false,
        writable: false,
        value : async function(id){
            try{
                if(this._m3uCache.has(id)){
                    return this._m3uCache.get(id);
                }

                if (!id) throw new Error("Function expect id parametr")
                const clientId = await this.getClientId();
                const permalink = (await this.resolve(id)).permalink_url;
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

                this._m3uCache.add(m3u);

                return m3u;
            } catch (error){
                throw new Error("Durring fetch m3u list occure prolbem. " + error.message);
            }
        }
    },

    fileSize : {
        enumerable: false,
        configurable: false,
        writable: false,
        value : async function(id){
            const m3u = await this._fetchM3u(id);
            return fileSize(m3u);
        }
    },

    download: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function (id, start, end) {
            try {
                const m3u =  await this._fetchM3u(id);
                let startIndex = 0;
                let startByte = 0;
                if(start && end){
                    ({startIndex, startByte} = await chunkStart(m3u, start));
                }

                const duplex = new Duplexify();
                const pipeChunk = async index => {
                    if (index > m3u.length - 1) return;
                    
                    const res = await fetch(m3u[index].url)

                    res.body.on("data", chunk => {
                        if(duplex.destroyed) return;
                        startByte += chunk;
                        if(startByte < start) return;
                        duplex.write(chunk)
                    })

                    res.body.on("end", () => pipeChunk(++index))
                }
                pipeChunk(startIndex);
                
                return {
                    fileSize : fileSize(m3u),
                    duplex
                }
            } catch (err) {
                console.log(err);
                return null;
            }
        }
    }, 

    // stream : {
    //     enumerable : false,
    //     configurable: false,
    //     writable : false,
    //     value : async function (id, start, end) {
    //         try {
    //             const m3u =  await this._fetchM3u(id);
    //             let {startIndex, startByte} = await chunkStart(m3u, start);

    //             const duplex = new Duplexify();
    //             const pipeChunk = async index => {
    //                 if (index > m3u.length - 1) {
    //                     return;
    //                 }
    //                 const res = await fetch(m3u[index].url);
    //                 res.body.on("data", chunk => {
    //                     if(duplex.destroyed) return;
    //                     startByte += chunk;
    //                     if(startByte < start) return;
    //                     duplex.write(chunk)
    //                 })
    //                 res.body.on("end", () => pipeChunk(++index))
    //             }
    //             pipeChunk(startIndex);

    //             return duplex;
    //         } catch (err) {
    //             console.log(err);
    //             return null;
    //         }
    //     }
    // }
})

module.exports = SoundCloudDl