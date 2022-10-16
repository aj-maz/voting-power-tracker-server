require("./mongooseConnector");
const { ethers } = require("ethers");
const config = require("./config.json");

const Events = require("./models/Events");
const EventSerializer = require("./events/EventSerializer");

const EventProcessor = require("./events/EventProcessor");

const handleTokenEventStream = require("./lib/handleTokenEventStream");
const JobQueue = require("./lib/JobQueue");

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
  handleTokenEventStream(provider)("token", config.TOKEN_ADDRESS);
  handleTokenEventStream(provider)("token+1", config.TOKEN_ADDRESS, 15014364);
  handleTokenEventStream(provider)("token+2", config.TOKEN_ADDRESS, 13014364);
  handleTokenEventStream(provider)("token+3", config.TOKEN_ADDRESS, 14014364);

  const votingPowerJobQueue = JobQueue();

  let isAddingToQueue = false;

  const addToQueue = async () => {
    if (isAddingToQueue) return;
    isAddingToQueue = true;
    const notProcessedEvents = await EventSerializer(
      config.TOKEN_ADDRESS,
      15257613
    );
    notProcessedEvents.forEach((ev, i) => {
      //  console.log(ev)
      console.log(i);
      votingPowerJobQueue.addJob(ev);
    });
    isAddingToQueue = false;
  };

  addToQueue();
  setInterval(async () => {
    addToQueue();
  }, 20 * 30 * 1000);

  const setEventProcessed = (_id) => {
    return new Promise((resolve, reject) => {
      Events.updateOne({ _id }, { $set: { processed: true } }, (err, done) => {
        if (err) return reject(err);
        return resolve(done);
      });
    });
  };

  setInterval(() => {
    votingPowerJobQueue.execute(async (currentJob) => {
      try {
        await EventProcessor("wbtc", null)(currentJob);
      } catch (err) {
        console.log(err);
      }
      //await setEventProcessed(currentJob._id);
    });
  }, 10);
};

main();
