const path = require("path");
const LocalStorage = require("node-localstorage").LocalStorage;

const EventMiner = require("./EventMiner");
const SingleEventSaver = require("./SingleEventSaver");
const GetBlockTimestamp = require("../lib/GetBlockTimestamp");
const config = require("../config.json");

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

const fetchEvents = (provider) => async (storagePrefix, contractAddress) => {
  const lastBlock = await provider.getBlock();

  const startingBlock = localStorage.getItem(`${storagePrefix}LastFetched`)
    ? parseInt(localStorage.getItem(`${storagePrefix}LastFetched`))
    : config.STARTING_BLOCK;
  return EventMiner(provider)(
    contractAddress,
    startingBlock,
    lastBlock.number,
    lastBlock.number - startingBlock > 1000
      ? 1000
      : lastBlock.number - startingBlock,
    (events, { lastFetchedBlock }) => {
      events.forEach(async (event) => {
        const happenedAt = await GetBlockTimestamp(provider)(event.blockNumber);

        SingleEventSaver(happenedAt)(event)
          .then((r) => console.log("event saved"))
          .catch((err) => console.log(err));
      });
      localStorage.setItem(`${storagePrefix}LastFetched`, lastFetchedBlock);
    }
  );
};

module.exports = fetchEvents;
