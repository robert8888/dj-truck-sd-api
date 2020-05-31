const express = require("express");
const router = express.Router();
const SoundCloudDl = require("./../sc/soundCloud");
const { createPartialContentHandler } = require("express-partial-content");

const streamContentProvider = async req => {
    const id = req.query.id;
    const sc = new SoundCloudDl();

    const fileName = (await sc.resolve(id)).title;
    const totalSize = await sc.fileSize(id);
    const mimeType = "audio/mpeg";

    const getStream = range => {
        let start, end; 
        if(range){
            ({start, end } = range);
        }

        return {
            pipe: target => sc.download(id, start ,end)
                .then( results => results.duplex.setWritable(target))
        }
    }
    return {
        fileName,
        totalSize,
        mimeType,
        getStream
    };
}

const handler = createPartialContentHandler(streamContentProvider, {
    debug: message => console.log(message)
})

router.get("/stream", handler)

module.exports = router;