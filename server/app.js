const express = require("express");
const cors = require('cors')
const fs = require('fs-extra')
const bodyParser = require('body-parser')

const app = express();
app.use(cors());
app.use(bodyParser.json());   



app.post("/", function (req, res) {
    console.log(typeof req.body)
    let info = req.body;

    info = info["exifInfo"].replace(/\\/g, "");

    fs.writeJson('../public/thing.json', info, err => {
        if (err) return console.error(err)
        console.log('success!')
      })
});

app.listen(8081, () => {
    console.log("App's running on port 8081");
});