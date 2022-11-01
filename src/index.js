require("./mongooseConnector");
const { ethers } = require("ethers");
const config = require("./config.json");

const EventSerializer = require("./events/EventSerializer");

const EventProcessor = require("./events/EventProcessor");

const handleTokenEventStream = require("./lib/handleTokenEventStream");
const JobQueue = require("./lib/JobQueue");

const Admin = require("./models/Admin");

const apiServer = require("./api");

const bot = require("./lib/Bot");

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
  //handleTokenEventStream(provider)("token", config.TOKEN_ADDRESS);

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

  Admin.methods.queries
    .getAll()
    .then((admins) => {
      if (admins.length === 0) {
        Admin.methods.commands
          .create(config.INITIAL_ADMIN, true)
          .then((res) => console.log("super admin created"))
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));

  apiServer();
};

main();
