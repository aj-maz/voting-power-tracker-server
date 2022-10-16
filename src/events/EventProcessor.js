//const Price = require("../models/Prices");
//const PriceFlag = require("../models/PriceFlag");
//const PriceBound = require("../models/PriceBound");
//const calculatePriceAndTimeDiff = require("../lib/calculatePriceAndTimeDiff");
const { methods } = require("../models/User");

const EventProcessor = (variant, discordManager) => async (ev) => {
  //console.log("Processing Event ....", ev)

  // Check if user does exist or not
  // If not create the user
  switch (ev.name) {
    case "DelegateChanged": {
      return;
    }
    case "DelegateVotesChanged": {
      //      console.log("DelegateVotesChanged", ev);
      return;
    }
    case "Transfer": {
      console.log(ev);
      // transfer to dest user
      // transfer from src user
      return;
    }
    case "Mint": {
      //transfer to user
    }
    case "Burn": {
      //transfer from user
    }
  }
};

module.exports = EventProcessor;
