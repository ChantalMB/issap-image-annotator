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
   let fp = './public/' + Object.keys(req.body)[0] + '.json'
   let info = Object.values(req.body)[0];
   
   for (let i = 0; i < Object.keys(info).length; i++) {
      info[Object.keys(info)[i]][0].artifacts = JSON.parse(info[Object.keys(info)[i]][0].artifacts)
   }

   console.log(info)


   fs.writeJson(fp, info, err => {
      if (err) return console.error(err)
      console.log('success!')
   })
   res.send(info)
});


app.use(express.static('public'));
app.get('*', (req, res) => {
   res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});
app.listen(port, () => {
   console.log(`Server is up at port ${port}`);
});