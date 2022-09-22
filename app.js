const express = require("express");

const app = express();
const port = 5050;

app.get("/", (req, res, next) => {
  res.json({ name: "CI-CD" });
});

app.listen(port, () => console.log(`Our app listening on port ${port}!`));

module.exports = app;
