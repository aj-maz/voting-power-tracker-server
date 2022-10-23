//const Price = require("../models/Prices");
//const PriceFlag = require("../models/PriceFlag");
//const PriceBound = require("../models/PriceBound");
//const calculatePriceAndTimeDiff = require("../lib/calculatePriceAndTimeDiff");
const { methods } = require("../models/User");

const EventProcessor = (variant, discordManager) => async (ev) => {
  //console.log("Processing Event ....", ev)

  // Check if user does exist or not
  // If not create the user
  try {
    switch (ev.name) {
      case "DelegateChanged": {
        return;
      }
      case "DelegateVotesChanged": {
        console.log("DelegateVotesChanged", ev);

        const delegateUser = (await methods.queries.doesUserExists(
          ev.args.delegate
        ))
          ? await methods.queries.getUserByAddress(ev.args.delegate)
          : await methods.commands.createUser(ev.args.delegate);

        await methods.commands.setDelegate(
          delegateUser.address,
          ev.args.newBalance
        );
        return;
      }
      case "Transfer": {
        //console.log("Transfer", ev);
        const sourceUser = (await methods.queries.doesUserExists(ev.args.src))
          ? await methods.queries.getUserByAddress(ev.args.src)
          : await methods.commands.createUser(ev.args.src);

        const destUser = (await methods.queries.doesUserExists(ev.args.dst))
          ? await methods.queries.getUserByAddress(ev.args.dst)
          : await methods.commands.createUser(ev.args.dst);

        await methods.commands.transferUser(
          sourceUser.address,
          ev.args.wad,
          false
        );
        await methods.commands.transferUser(
          destUser.address,
          ev.args.wad,
          true
        );
        return;
      }
      case "Mint": {
        //console.log("Mint", ev);

        const sourceUser = (await methods.queries.doesUserExists(ev.args.guy))
          ? await methods.queries.getUserByAddress(ev.args.guy)
          : await methods.commands.createUser(ev.args.guy);
        await methods.commands.transferUser(
          sourceUser.address,
          ev.args.wad,
          true
        );
        return;
      }
      case "Burn": {
        //console.log("Burn", ev);

        const destUser = (await methods.queries.doesUserExists(ev.args.guy))
          ? await methods.queries.getUserByAddress(ev.args.guy)
          : await methods.commands.createUser(ev.args.guy);
        await methods.commands.transferUser(
          destUser.address,
          ev.args.wad,
          false
        );
        return;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = EventProcessor;
