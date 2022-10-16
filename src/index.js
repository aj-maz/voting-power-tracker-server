require("./mongooseConnector");
const { ethers } = require("ethers");
const config = require("./config.json");

const Events = require("./models/Events");
const EventSerializer = require("./events/EventSerializer");

const handleTokenEventStream = require('./lib/handleTokenEventStream')

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
  handleTokenEventStream(provider)("token", config.TOKEN_ADDRESS)
};

main()