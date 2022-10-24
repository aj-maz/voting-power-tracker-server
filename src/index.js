require("./mongooseConnector");
const { ethers } = require("ethers");
const config = require("./config.json");

const Events = require("./models/Events");
const EventSerializer = require("./events/EventSerializer");

const EventProcessor = require("./events/EventProcessor");

const handleTokenEventStream = require("./lib/handleTokenEventStream");
const JobQueue = require("./lib/JobQueue");

const apiServer = require('./api')

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
  handleTokenEventStream(provider)("token", config.TOKEN_ADDRESS);

  const votingPowerJobQueue = JobQueue();

  let isAddingToQueue = false;

  /*const addToQueue = async () => {
    if (isAddingToQueue) return;
    isAddingToQueue = true;
    const notProcessedEvents = await EventSerializer(
      config.TOKEN_ADDRESS,
      config.STARTING_BLOCK //15257613
    );
    notProcessedEvents.forEach((ev, i) => {
      //  console.log(ev)
      if (i % 1000 == 0) {
        console.log(i);
      }
      votingPowerJobQueue.addJob(ev);
    });
    isAddingToQueue = false;
  };

  addToQueue();
   setInterval(async () => {
     addToQueue();
   }, 1000 * 30);

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
        await EventProcessor("", null)(currentJob);
        await setEventProcessed(currentJob._id);
      } catch (err) {
        console.log(err);
      }

      //await setEventProcessed(currentJob._id);
    });
  }, 5);*/

  apiServer()
};

main();
