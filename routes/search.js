const express = require("express");
const router = express.Router();
//const scdl = require("soundcloud-dl");
const SoundCloudDl = require("./../sc/soundCloud");


const resultParse = item => ({
    sourceId: item.id,
    etag: item.last_modified, 
    title: item.title,
    description: (item.description || item.genre || "").substr(0,255),
    source: "SoundCloud",
    duration: item.duration / 1000,
    quality: "sd",
    thumbnails: {
        default: {
            url: item.artwork_url && item.artwork_url.replace('-large', '-t120x120'),
            width: 120,
            height: 120,
        },
        medium: {
            url: item.artwork_url && item.artwork_url.replace('-large', '-t300x300'),
            width: 300,
            height: 300,
        },
        high: {
            url: item.artwork_url && item.artwork_url.replace('-large', '-t500x500'),
            width: 500,
            height: 500,
        }
    },
})

router.get("/search", async (req, res) =>{
    const query = req.query.q;
    const limit = req.query.maxResults;
    const scdl = new SoundCloudDl();
    const results = await scdl.search(query, limit, resultParse);
    if(!results){
        res.status(404).send("Not found");
        return;
    }
    res.setHeader("Content-type", "aplication/json")
    res.json(results);
})

module.exports = router;