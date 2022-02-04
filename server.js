const express = require("express");
const cors = require('cors')
const fs = require('fs-extra')
const bodyParser = require('body-parser')
const path = require('path');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(bodyParser.json());   

app.post("/", function (req, res) {
    let info = req.body;

    console.log(typeof info)
   //  info = info.replace(/\\/g, "");

   //  fs.writeJson('../public/thing.json', info, err => {
   //      if (err) return console.error(err)
   //      console.log('success!')
   //    })
});


app.use(express.static('public'));
app.get('*', (req, res) => {
   res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});
app.listen(port, () => {
   console.log(`Server is up at port ${port}`);
});