require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const connectToDatabase = require("./database");
const router = require("./router/route");
const path = require("path");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());

app.get("/", (req, res) => {
  res.json("backend is Running");
});

connectToDatabase.then(() => {
  app.use("/api/", router);

  //error handler
  app.use(function (err, req, res, next) {
    res.status(500);
    console.log(err,"hsgfsgfugfsj")
    res.send({
      message: "something went wrong",
      error: err?.message || err,
      code: err.code,
    });
  });

  app.listen(5000, () => {
    console.log(`Server is running at port 5000`);
  });
});

module.exports = app;
