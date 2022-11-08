require("./mongooseConnector");
const { ethers } = require("ethers");
const config = require("./config.json");

const EventSerializer = require("./events/EventSerializer");

const EventProcessor = require("./events/EventProcessor");

const handleTokenEventStream = require("./lib/handleTokenEventStream");
const JobQueue = require("./lib/JobQueue");

const Admin = require("./models/Admin");

const apiServer = require("./api");

const {
  isUserBalanceChangedAbsolute,
  isUserBalanceChangedRelative,
} = require("./lib/AlertCalculators");

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);

  apiServer(provider);
};

main();
