const path = require("path");
const LocalStorage = require("node-localstorage").LocalStorage;

const EventMiner = require("./EventMiner");
const SingleEventSaver = require("./SingleEventSaver");
const GetBlockTimestamp = require("../lib/GetBlockTimestamp");
const config = require("../config.json");

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

const fetchEvents =
  (provider, paused) => async (storagePrefix, contractAddress, stBlock) => {
    try {
      const lastBlock = await provider.getBlock();

      const startingBlock = stBlock
        ? stBlock
        : localStorage.getItem(`lastFetchedBlock`)
        ? parseInt(localStorage.getItem(`lastFetchedBlock`))
        : parseInt(localStorage.getItem(`tokenCreationBlock`));
      return EventMiner(provider, paused)(
        contractAddress,
        startingBlock,
        lastBlock.number,
        lastBlock.number - startingBlock > 1000
          ? 1000
          : lastBlock.number - startingBlock,
        (events, { lastFetchedBlock }) => {
          events.forEach(async (event) => {
            const happenedAt = await GetBlockTimestamp(provider)(
              event.blockNumber
            );

            SingleEventSaver(happenedAt)(event)
              .then((r) => console.log("event saved"))
              .catch((err) => console.log(err));
          });
          localStorage.setItem(`lastFetchedBlock`, lastFetchedBlock);
        }
      );
    } catch (err) {
      console.log(err);
    }
  };

module.exports = fetchEvents;
