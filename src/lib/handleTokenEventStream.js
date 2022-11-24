const path = require("path");
const { ethers } = require("ethers");
const FetchEvents = require("../events/FetchEvents");
const ReflexerTokenABI = require("../contracts/ReflexerToken");
const TokenEventFilterCreator = require("../events/TokenEventFilterCreator");
const SingleEventSaver = require("../events/SingleEventSaver");
const GetBlockTimestamp = require("./GetBlockTimestamp");
const GetTransactionFrom = require("../lib/GetTransactionFrom");
const LocalStorage = require("node-localstorage").LocalStorage;

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

let alreadySubbing = false;

const handleTokenEventStream =
  (provider, paused, currentRunners) =>
  async (storagePrefix, contractAddress, stBlock) => {
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
        if (!alreadySubbing) {
          targetContract.on(
            TokenEventFilterCreator(provider)(targetContract.address),
            async (event) => {
              const happenedAt = await GetBlockTimestamp(provider)(
                event.blockNumber
              );
              const from = await GetTransactionFrom(provider)(
                event.transactionHash
              );

              SingleEventSaver(
                happenedAt,
                from
              )(event)
                .then((r) => console.log("event saved"))
                .catch((err) => console.log(err));
              localStorage.setItem(`lastFetchedBlock`, event.blockNumber);
            }
          );
          alreadySubbing = true;
        }
      }
    }, 60 * 2 * 1000);
  };

module.exports = handleTokenEventStream;
