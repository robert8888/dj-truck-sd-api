require("dotenv").config();
const express = require("express");
const cors = require("express-cors");
const { renderHome } = require("./pages/homeTpl");
const search = require("./routes/search");
const download = require("./routes/download");

const PORT = process.env.PORT || 80;

const app = express();
app.use(cors());

app.use("/", search);
app.use("/", download);

app.get("/", (req, res) => {
    const home = renderHome({});
    res.send(home);
})

app.listen(PORT, () => {
    console.log(`Server started on port : ${PORT}`)
})
