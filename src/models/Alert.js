const path = require("path");
const LocalStorage = require("node-localstorage").LocalStorage;
const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);



module.exports = {
  get: () => {
    return localStorage.getItem("alertSettings")
      ? JSON.parse(localStorage.getItem("alertSettings"))
      : defaultSettings;
  },

  start: (settings) => {
    settings.status = 1;
    localStorage.setItem("alertSettings", settings);

  },

  stop: () => {},
};
module.exports = {};
