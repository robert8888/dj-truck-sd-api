const fetch = require("node-fetch");

SoundCloudDl = function (serachParseData) {
    this.serachParseData = serachParseData;
    this.urlBase = "https://soundcloud.com/";
    this.apiUrlBase = "https://api-v2.soundcloud.com";
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

    search: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: async function (query, limit = 10, parseData = this.parseSearchData) {
            if (!parseData) {
                throw new Error("Serach function expect parse function which will format results")
            }
            const clientId = await this.getClientId();
            const url = `${this.apiUrlBase}/search?q=${query}&limit=${limit}&client_id=${clientId}`;
            const result = await fetch(url);
            if(result.status > 200){
                return [];
            }
            let json = await result.json();
          //  console.log(json)
            return json.collection
                .filter(item => item.kind === "track")
                .map(item => parseData(item));
        }
    }
})

module.exports = SoundCloudDl