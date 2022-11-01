const { ethers } = require("ethers");
const mongoose = require("mongoose");
const ReflexerTokenABI = require("../contracts/ReflexerToken");

var EventSchema = new mongoose.Schema(
  {
    blockNumber: {
      type: Number,
      index: true,
    },
    transactionIndex: {
      type: Number,
      index: true,
    },
    address: {
      type: String,
      index: true,
      lowercase: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    happenedAt: {
      type: Date,
      required: true,
    },
  },
  { strict: false }
);
var EventModel = mongoose.model("events", EventSchema);

const query = ({ limit, offset }) => {
  const iface = new ethers.utils.Interface(ReflexerTokenABI);

  return new Promise((resolve, reject) => {
    return EventModel.find({})
      .limit(limit)
      .skip(offset)
      .sort({ happenedAt: -1 })
      .exec(async (err, tes) => {
        if (err) return reject(err);
        const count = await EventModel.countDocuments({}).exec();
        const items = tes.map((te) => ({ ...te._doc, ...iface.parseLog(te) }));
        return resolve({ count, items });
      });
  });
};

const counts = async () => {
  return {
    processed: await EventModel.countDocuments({ processed: true }),
    total: await EventModel.countDocuments({}),
  };
};

module.exports = { EventModel, query, counts };
