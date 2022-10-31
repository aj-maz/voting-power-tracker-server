const path = require("path");
const { ethers } = require("ethers");
const FetchEvents = require("../events/FetchEvents");
const ReflexerTokenABI = require("../contracts/ReflexerToken");
const TokenEventFilterCreator = require("../events/TokenEventFilterCreator");
const SingleEventSaver = require("../events/SingleEventSaver");
const GetBlockTimestamp = require("./GetBlockTimestamp");
const LocalStorage = require("node-localstorage").LocalStorage;

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);


const handleTokenEventStream =
  (provider, paused, currentRunners) => async (storagePrefix, contractAddress, stBlock) => {
    const targetContract = new ethers.Contract(
      contractAddress,
      ReflexerTokenABI,
      provider
    );

    if (currentRunners[0] == false) {
      currentRunners[0] = true;
      await FetchEvents(provider, paused)(
        storagePrefix,
        targetContract.address,
        stBlock
      );
      currentRunners[0] = false;
    }

    // TODO need to handle this somehow
    setInterval(async () => {
      console.log("Current Runners: ", currentRunners);

      if (currentRunners[0] == false) {
        currentRunners[0] = true;
        await FetchEvents(provider, paused)(
          storagePrefix,
          targetContract.address,
          stBlock
        );
        currentRunners[0] = false;
      }
    }, 60 * 2 * 1000);

    targetContract.on(
      TokenEventFilterCreator(provider)(targetContract.address),
      async (event) => {
        const happenedAt = await GetBlockTimestamp(provider)(event.blockNumber);
        console.log(event);
        SingleEventSaver(happenedAt)(event)
          .then((r) => console.log("event saved"))
          .catch((err) => console.log(err));
        localStorage.setItem(`lastFetchedBlock`, event.blockNumber);
      }
    );
  };

module.exports = handleTokenEventStream;
