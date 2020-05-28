const m3uReader = require("m3u8-reader");

const m3uParser = m3u => {
    m3u = m3uReader(m3u);
    return m3u.filter( row => {
        return (
            typeof row === "string" ||
            typeof row === "object" && row.EXTINF
        )
    }).map( row => {
        if(typeof row === "string"){
            return row;
        } else if(row.EXTINF){
            return +row.EXTINF;
        }
    }).reduce( (result, _, index, array) => {
        if (index % 2 === 0)
            result.push({
                length: array[index],
                url: array[index+1]
            });
        return result;
    }, [])
}

const fileSize = scM3u => {
    const last = scM3u[scM3u.length - 1].url;
    const pattern = /https:\/\/cf-hls-media\.sndcdn\.com\/media\/\d+\/(?<size>\d+)/
    const match = last.match(pattern);
    if(match && match.groups.size){
        return match.groups.size;
    }
    
    throw new Error("Can't find file size");
}

module.exports = {
    m3uParser,
    fileSize
}