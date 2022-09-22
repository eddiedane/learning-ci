const express = require("express");

const app = express();

app.get("/", (req, res, next) => {
  res.send("Working...");
});

app.listen(5050);
