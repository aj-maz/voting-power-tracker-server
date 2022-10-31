const ethers = require("ethers");
const path = require("path");

const ReflexerTokenABI = require("../contracts/ReflexerToken");
const LocalStorage = require("node-localstorage").LocalStorage;

const TokenEventFilterCreator = require("./TokenEventFilterCreator");

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

const MineTokenEvents =
  (provider, paused) =>
  async (contractAddress, startingBlock, endingBlock, contractSkip, cb) => {
    const ReflexerTokenContract = new ethers.Contract(
      contractAddress,
      ReflexerTokenABI,
      provider
    );

    const queryBatch = async (from, to, skip, attempt = 1) => {
      const sleep = (timeout) =>
        new Promise((resolve, reject) => {
          setTimeout(() => resolve(), timeout);
        });

      if (parseInt(localStorage.getItem("fetchingStatus")) == 0) {
        return;
      }

      if (parseInt(localStorage.getItem("fetchingStatus")) == 2) {
        await sleep(4000);
        return queryBatch(from, to, skip, attempt);
      }

      if (skip === 0) {
        console.log("already fetched all blocks");
        return;
      }

      try {
        console.log(`fetching from block ${from} to ${from + skip - 1} ...`);
        const fileteredEvents = await ReflexerTokenContract.queryFilter(
          TokenEventFilterCreator(provider)(contractAddress),
          from,
          from + skip - 1
        );

        cb(fileteredEvents, { lastFetchedBlock: from + skip - 1 });

        const nextFrom = from + skip;
        const nextTo = from + 2 * skip;
        const lastBlock =
          (await provider.getBlockNumber()) > to
            ? to
            : await provider.getBlockNumber();
        if (nextFrom > lastBlock) {
          return queryBatch(lastBlock, to, 0);
        } else if (nextTo > lastBlock) {
          return queryBatch(nextFrom, to, lastBlock - nextFrom);
        } else {
          return queryBatch(nextFrom, to, skip);
        }
      } catch (err) {
        const waitTime = 1000 * attempt;
        console.log(`some error happened, will retry in ${waitTime} sec`, err);
        await sleep(waitTime);
        return queryBatch(from, to, skip, attempt + 1);
      }
    };

    return queryBatch(startingBlock, endingBlock, contractSkip);
  };

module.exports = MineTokenEvents;
