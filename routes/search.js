const express = require("express");
const router = express.Router();
//const scdl = require("soundcloud-dl");
const SoundCloudDl = require("./../sc/soundCloud");


const resultParse = item => ({
    sourceId: item.id,
    etag: item.last_modified, 
    title: item.title,
    description: item.description || item.genre,
    source: "SoundCloud",
    duration: item.duration,
    quality: "hd",
    thumbnails: {
        default: {
            url: item.artwork_url.replace('-large', '-t120x120'),
            width: 120,
            height: 120,
        },
        medium: {
            url: item.artwork_url.replace('-large', '-t300x300'),
            width: 300,
            height: 300,
        },
        high: {
            url: item.artwork_url.replace('-large', '-t500x500'),
            width: 500,
            height: 500,
        }
    }
})

router.get("/search", async (req, res) =>{
    const query = req.query.q;
    const scdl = new SoundCloudDl();
    const results = await scdl.search(query, 10, resultParse);
    res.json(results);
})

module.exports = router;