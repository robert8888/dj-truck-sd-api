require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { renderHome } = require("./pages/homeTpl");
const search = require("./api/search");
const download = require("./api/download");
const stream = require("./api/stream");
const resolve = require("./api/resolve");


const PORT = process.env.PORT || 80;

const app = express();
app.use(cors());

app.use("/api", search);
app.use("/api", download);
app.use("/api", stream);
app.use("/api", resolve);

app.get("/", (req, res) => {
    const home = renderHome({});
    res.send(home);
})

app.listen(PORT, () => {
    console.log(`Server started on port : ${PORT}`)
})
