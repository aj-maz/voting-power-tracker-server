const { ethers } = require("ethers");
const { EventModel } = require("../models/Events");

const ReflexerTokenABI = require("../contracts/ReflexerToken");

const a = {
  _id: "637f8c3d02319565f362d97f",
  blockNumber: 16039330,
  transactionIndex: 0,
  address: "0x6243d8cea23066d098a15582d81a598b4e8391f4",
  uniqueId: "16039330:0:1",
  processed: true,
  happenedAt: new Date("2022-11-24T10:46:11Z"),
  from: "0xDAf886a8ccF0af82088eFBe7BEA4273174f86500",
  blockHash:
    "0x09fd60f2750a6c371725a65bd938d8a358eeebc887e5d3577cb860a6bf4ec9e4",
  removed: false,
  data: "0x000000000000000000000000000000000000000000000002a2a030a48959f7c9",
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x000000000000000000000000a6a22e0a89ebcb85444833a5b3c6d13d51e3bb9b",
    "0x000000000000000000000000d6f3768e62ef92a9798e5a8cedd2b78907cecef9",
  ],
  transactionHash:
    "0x0bb90de729b3a18090867f0da8c4a22a821e94743fa8ef237ad90145460f6485",
  logIndex: 1,
  __v: 0,
};

const iface = new ethers.utils.Interface(ReflexerTokenABI);

const r = {
  ...a,
  ...iface.parseLog(a),
};

console.log(String(r.args.wad));

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
