const path = require("path");
const LocalStorage = require("node-localstorage").LocalStorage;

//const Price = require("../models/Prices");
//const PriceFlag = require("../models/PriceFlag");
//const PriceBound = require("../models/PriceBound");
//const calculatePriceAndTimeDiff = require("../lib/calculatePriceAndTimeDiff");
const { methods } = require("../models/User");

/// https://discord.com/oauth2/authorize?client_id=1037028431558348881&permissions=3072&scope=bot

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

const EventProcessor = (variant, discordManager) => async (ev) => {
  //console.log("Processing Event ....", ev)

  // Check if user does exist or not
  // If not create the user
  localStorage.setItem("lastProcessedBlock", ev.blockNumber);

  try {
    switch (ev.name) {
      case "DelegateChanged": {
        return;
      }
      case "DelegateVotesChanged": {
        const delegateUser = (await methods.queries.doesUserExists(
          ev.args.delegate
        ))
          ? await methods.queries.getUserByAddress(ev.args.delegate)
          : await methods.commands.createUser(ev.args.delegate);

        await methods.commands.setDelegate(
          delegateUser.address,
          ev.args.newBalance,
          ev.happenedAt
        );
        return;
      }
      case "Transfer": {
        //console.log("Transfer", ev);
        try {
          const sourceUser = (await methods.queries.doesUserExists(ev.args.src))
            ? await methods.queries.getUserByAddress(ev.args.src)
            : await methods.commands.createUser(ev.args.src);

          const destUser = (await methods.queries.doesUserExists(ev.args.dst))
            ? await methods.queries.getUserByAddress(ev.args.dst)
            : await methods.commands.createUser(ev.args.dst);

          await methods.commands.transferUser(
            sourceUser.address,
            ev.args.wad,
            false,
            ev.happenedAt
          );
          await methods.commands.transferUser(
            destUser.address,
            ev.args.wad,
            true,
            ev.happenedAt
          );
          return;
        } catch (err) {
          console.log(err);
          return;
        }

        return;
      }
      case "Mint": {
        const sourceUser = (await methods.queries.doesUserExists(ev.args.guy))
          ? await methods.queries.getUserByAddress(ev.args.guy)
          : await methods.commands.createUser(ev.args.guy);
        await methods.commands.transferUser(
          sourceUser.address,
          ev.args.wad,
          true,
          ev.happenedAt
        );
        return;
      }
      case "Burn": {
        const destUser = (await methods.queries.doesUserExists(ev.args.guy))
          ? await methods.queries.getUserByAddress(ev.args.guy)
          : await methods.commands.createUser(ev.args.guy);
        await methods.commands.transferUser(
          destUser.address,
          ev.args.wad,
          false,
          ev.happenedAt
        );
        return;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = EventProcessor;
