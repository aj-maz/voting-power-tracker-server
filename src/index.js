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

  apiServer(provider);
};

main();
