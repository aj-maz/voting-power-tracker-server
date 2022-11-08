const path = require("path");
const LocalStorage = require("node-localstorage").LocalStorage;
const handleTokenEventStream = require("../lib/handleTokenEventStream");
const { ethers } = require("ethers");
const config = require("../config.json");

const Events = require("./Events");

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

const Fetcher = () => {
  let currentRunners = [false];

  let isRunning = parseInt(localStorage.getItem("fetchingStatus")) > 0;
  let paused = [parseInt(localStorage.getItem("fetchingStatus")) == 2];
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);

  if (isRunning) {
    handleTokenEventStream(
      provider,
      paused,
      currentRunners
    )("token", localStorage.getItem("tokenAddress"));
  }

  return {
    get: () => {
      return {
        status: localStorage.getItem("fetchingStatus")
          ? Number(localStorage.getItem("fetchingStatus"))
          : 0,
        tokenAddress: localStorage.getItem("tokenAddress"),
        tokenCreationBlock: localStorage.getItem("tokenCreationBlock"),
        lastFetchedBlock: localStorage.getItem("lastFetchedBlock"),
      };
    },

    start: ({ tokenAddress, tokenCreationBlock }) => {
      localStorage.setItem("fetchingStatus", 1);
      localStorage.setItem("tokenAddress", tokenAddress);
      localStorage.setItem("tokenCreationBlock", tokenCreationBlock);
      //localStorage.setItem("lastFetchedBlock", tokenCreationBlock);
      paused[0] = false;
      isRunning = true;
      handleTokenEventStream(
        provider,
        paused,
        currentRunners
      )("token", tokenAddress);

      // Should actualy start the fetching
      return "done";
    },

    pause: () => {
      localStorage.setItem("fetchingStatus", 2);
      paused[0] = true;

      // Should actualy pause the fetching
      return "done";
    },

    resume: () => {
      localStorage.setItem("fetchingStatus", 1);
      paused[0] = false;
      return "done";
    },

    reset: async () => {
      localStorage.setItem("fetchingStatus", 0);
      localStorage.setItem("lastFetchedBlock", "");
      paused[0] = false;
      isRunning = false;
      await Events.EventModel.deleteMany({});
      return "done";
      // Should actualy resume the fetching
      //return "done";
    },
  };
};

module.exports = Fetcher();
