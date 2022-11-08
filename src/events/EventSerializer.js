const { ethers } = require("ethers");
const { EventModel } = require("../models/Events");

const ReflexerTokenABI = require("../contracts/ReflexerToken");

const EventSerializer = (address, startingBlock = 0) => {
  const iface = new ethers.utils.Interface(ReflexerTokenABI);

  return new Promise((resolve, reject) => {
    EventModel.find(
      {
        address: address.toLowerCase(),
        blockNumber: { $gt: startingBlock },
        processed: false,
      },
      {
        strict: false,
      }
    )
      .sort({ blockNumber: 1, logIndex: 1 })
      .select({
        blockNumber: 1,
        _id: 1,
        logIndex: 1,
        transactionIndex: 1,
        humanizedArgs: 1,
      })
      .exec((err, tes) => {
        if (err) return reject(err);

        const tesMap = tes.map((te) => ({ ...te._doc, ...iface.parseLog(te) }));

        return resolve(tesMap);
      });
  });
};

module.exports = EventSerializer;
