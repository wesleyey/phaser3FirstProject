var express = require("express");
var app = express();
var fs = require("fs");

//app.engine("html", require("ejs").renderFile);
//app.set("view engine", "html");
//app.use("/game", express.static("/public"));

app.use("/", express.static(__dirname + "/"));
//first "location on code" second "actual location"

app.get("/", function(req, res) {
  fs.readFile("index.html", function(error, data) {
    if (error) {
      console.log(error);
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
});

app.listen(3000, function() {
  console.log("App listening on port 3000");
});
