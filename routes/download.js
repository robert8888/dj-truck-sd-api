const express = require("express");
const router = express.Router();
const SoundCloudDl = require("./../sc/soundCloud");

router.get("/download", async (req, res) =>{
    let id = req.query.id;
    const sc = new SoundCloudDl();
    const results = await sc.download(id);
    if(!results){
        res.status(404).send("Not found");
    }
    res.setHeader('Content-type', 'audio/mpeg');
    res.setHeader('Content-length', results.fileSize)
    results.duplex.setWritable(res)
})
module.exports = router;