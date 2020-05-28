const express = require("express");
const router = express.Router();
const SoundCloudDl = require("./../sc/soundCloud");

router.get("/resolve", async (req, res) =>{
    let id = req.query.id;
    let url = req.query.url;
    if(id && url){
        res.status(400)
            .send("You can not request for url and id at the same time. Choice id or url")
    }

    const sc = new SoundCloudDl();
    const results = await sc.resolve(id, url);

    if(!results){
        res.status(404).send("Not found");
        return;
    }
    res.setHeader("Content-type", "aplication/json");
    res.json(results)
})
module.exports = router;