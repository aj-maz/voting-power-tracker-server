const mongoose = require("mongoose");
const config = require("./config.json");

mongoose.connect(config.MONGOOSE_CONNECTION_URL, (err, connect) => {
  if (err) return console.log(err);
  return console.log(`Connected to ${config.MONGOOSE_CONNECTION_URL}`);
});
