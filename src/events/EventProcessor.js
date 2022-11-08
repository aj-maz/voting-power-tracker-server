const path = require("path");
const LocalStorage = require("node-localstorage").LocalStorage;

//const Price = require("../models/Prices");
//const PriceFlag = require("../models/PriceFlag");
//const PriceBound = require("../models/PriceBound");
//const calculatePriceAndTimeDiff = require("../lib/calculatePriceAndTimeDiff");
const { methods } = require("../models/User");
const moment = require("moment");
const {
  isUserBalanceChangedAbsolute,
  isUserBalanceChangedRelative,
  isUserDelegateChangedAbsolute,
  isUserDelegateChangedRelative,
} = require("../lib/AlertCalculators");
const runBot = require("../lib/Bot");
const { ethers } = require("ethers");

/// https://discord.com/oauth2/authorize?client_id=1037028431558348881&permissions=3072&scope=bot

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

let sendM;

const main = async () => {
  const { sendMessage } = await runBot();
  sendM = sendMessage;
};

main();

const cleanFixed = (str) => {
  if (str[str.length - 1] === "0") {
    return cleanFixed(str.substring(0, str.length - 1));
  } else {
    return str;
  }
};

let alreadyStartedProcessing = new Set()

setInterval(() => {
  alreadyStartedProcessing = new Set()
}, 1000 * 3600 * 2)

const EventProcessor = (variant, discordManager, settings) => async (ev) => {
  //console.log("Processing Event ....", ev)

  // Check if user does exist or not
  // If not create the user
  localStorage.setItem("lastProcessedBlock", ev.blockNumber);

  const { alertSettings } = settings;

  if(alreadyStartedProcessing.has(ev._id)) {
    return
  }

  alreadyStartedProcessing.add(ev._id)

  try {
    switch (ev.name) {
      case "DelegateChanged": {
        return;
      }
      case "DelegateVotesChanged": {
        console.log("here");
        if (alertSettings.delegateRelative.active) {
          const relativeChange = await isUserDelegateChangedRelative(
            {
              blockNumber: ev.blockNumber,
              happenedAt: new Date(ev.happenedAt),
            },
            ev.args.delegate.toLowerCase(),
            {
              percent: alertSettings.delegateRelative.percent,
              timeframe: alertSettings.delegateRelative.timeframe,
            }
          );

          if (relativeChange) {
            sendM(
              settings.alertSettings.delegateRelative.message
                .replace(
                  "$time$",
                  `${settings.alertSettings.delegateRelative.timeframe}`
                )
                .replace("$delegatee$", ev.args.delegate)

                .replace("$percent$", cleanFixed(relativeChange.toFixed(6)))
                .replace(
                  "$at$",
                  moment(ev.happenedAt).format("DD.MM.YYYY HH:mm")
                )
            );
          }
        }

        if (alertSettings.delegateAmount.active) {
          const absChange = await isUserDelegateChangedAbsolute(
            {
              blockNumber: ev.blockNumber,
              happenedAt: new Date(ev.happenedAt),
            },
            ev.args.delegate.toLowerCase(),
            {
              amount: alertSettings.delegateAmount.amount,
              timeframe: alertSettings.delegateAmount.timeframe,
            }
          );

          if (absChange) {
            sendM(
              settings.alertSettings.delegateAmount.message
                .replace("$delegatee$", ev.args.delegate)
                .replace(
                  "$time$",
                  `${settings.alertSettings.delegateAmount.timeframe}`
                )
                .replace(
                  "$amount$",
                  Number(ethers.utils.formatEther(absChange)).toFixed(5)
                )
                .replace(
                  "$at$",
                  moment(ev.happenedAt).format("DD.MM.YYYY HH:mm")
                )
            );
          }
        }

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

          if (alertSettings.transferRelative.active) {
            const relativeChange = await isUserBalanceChangedRelative(
              {
                blockNumber: ev.blockNumber,
                happenedAt: new Date(ev.happenedAt),
              },
              ev.args.dst.toLowerCase(),
              {
                percent: alertSettings.transferRelative.percent,
                timeframe: alertSettings.transferRelative.timeframe,
              }
            );

            if (relativeChange) {
              sendM(
                settings.alertSettings.transferRelative.message
                  .replace(
                    "$time$",
                    `${settings.alertSettings.transferRelative.timeframe}`
                  )
                  .replace("$to$", ev.args.dst)
                  .replace(
                    "$time$",
                    `${settings.alertSettings.transferRelative.timeframe}`
                  )
                  .replace("$percent$", cleanFixed(relativeChange.toFixed(6)))
                  .replace(
                    "$at$",
                    moment(ev.happenedAt).format("DD.MM.YYYY HH:mm")
                  )
              );
            }
          }

          if (alertSettings.transferAmount.active) {
            const absChange = await isUserBalanceChangedAbsolute(
              {
                blockNumber: ev.blockNumber,
                happenedAt: new Date(ev.happenedAt),
              },
              ev.args.dst.toLowerCase(),
              {
                amount: alertSettings.transferAmount.amount,
                timeframe: alertSettings.transferAmount.timeframe,
              }
            );

            if (absChange) {
              sendM(
                settings.alertSettings.transferAmount.message
                  .replace(
                    "$time$",
                    `${settings.alertSettings.transferAmount.timeframe}`
                  )
                  .replace("$from$", ev.args.src)
                  .replace("$to$", ev.args.dst)
                  .replace(
                    "$time$",
                    `${settings.alertSettings.transferAmount.timeframe}`
                  )
                  .replace(
                    "$amount$",
                    Number(ethers.utils.formatEther(absChange)).toFixed(5)
                  )
                  .replace(
                    "$at$",
                    moment(ev.happenedAt).format("DD.MM.YYYY HH:mm")
                  )
              );
            }
          }

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

        if (alertSettings.transferRelative.active) {
          const relativeChange = await isUserBalanceChangedRelative(
            {
              blockNumber: ev.blockNumber,
              happenedAt: new Date(ev.happenedAt),
            },
            ev.args.guy.toLowerCase(),
            {
              percent: alertSettings.transferRelative.percent,
              timeframe: alertSettings.transferRelative.timeframe,
            }
          );

          if (relativeChange) {
            sendM(
              settings.alertSettings.transferRelative.message
                .replace(
                  "$time$",
                  `${settings.alertSettings.transferRelative.timeframe}`
                )
                .replace("$to$", ev.args.guy)
                .replace("$percent$", cleanFixed(relativeChange.toFixed(6)))
                .replace(
                  "$at$",
                  moment(ev.happenedAt).format("DD.MM.YYYY HH:mm")
                )
            );
          }
        }

        if (alertSettings.transferAmount.active) {
          const absChange = await isUserBalanceChangedAbsolute(
            {
              blockNumber: ev.blockNumber,
              happenedAt: new Date(ev.happenedAt),
            },
            ev.args.guy.toLowerCase(),
            {
              amount: alertSettings.transferAmount.amount,
              timeframe: alertSettings.transferAmount.timeframe,
            }
          );

          if (absChange) {
            sendM(
              settings.alertSettings.transferAmount.message
                .replace("$from$", "Address ZERO")
                .replace("$to$", ev.args.guy)
                .replace(
                  "$time$",
                  `${settings.alertSettings.transferAmount.timeframe}`
                )
                .replace(
                  "$amount$",
                  Number(ethers.utils.formatEther(absChange)).toFixed(5)
                )
                .replace(
                  "$at$",
                  moment(ev.happenedAt).format("DD.MM.YYYY HH:mm")
                )
            );
          }
        }

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
