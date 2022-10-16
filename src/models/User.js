const mongoose = require("mongoose");
const { ethers } = require("ethers");

const UserSchema = new mongoose.Schema(
  {
    address: {
      type: string,
      required: true,
      unique: true,
    },
    currentBalance: {
      type: string,
      required: true,
      default: "0",
    },
    currentVotingPower: {
      type: string,
      required: true,
      default: "0",
    },
    delegationHistory: [
      {
        timestamp: Date,
        amount: string,
      },
    ],
    balanceHistory: [
      {
        timestamp: Date,
        amount: string,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Users = mongoose.model("user", UserSchema);

const methods = {
  queries: {
    doesUserExists: (address) => {
      return new Promise((resolve, reject) => {
        Users.findOne({ address }, (err, user) => {
          if (err) return reject(err);
          if (!user) return resolve(false);
          return resolve(true);
        });
      });
    },

    getUserByAddress: (address) => {
      return new Promise((resolve, reject) => {
        Users.findOne({ address }, (err, user) => {
          if (err) return reject(err);
          return resolve(user);
        });
      });
    },
  },
  commands: {
    createUser: (address) => {
      return new Promise((resolve, reject) => {
        const usr = new Users({ address });
        return resolve(usr.save());
      });
    },
    transferUser: (address, amount, to) => {
      return new Promise((resolve, reject) => {
        methods.queries
          .getUserByAddress(address)
          .then((user) => {
            const newBalance = to
              ? ethers.BigNumber.from(user.currentBalance).add(amount)
              : ethers.BigNumber.from(user.currentBalance).sub(amount);
            Users.updateOne(
              { address },
              {
                $set: {
                  currentBalance: newBalance,
                },
                $push: {
                  balanceHistory: {
                    timestamp: new Date(),
                    amount: newBalance,
                  },
                },
              }
            );
          })
          .then((r) => {
            return resolve("done");
          })
          .catch((err) => {
            return reject(err);
          });
      });
    },

    delegateUser: (address, amount, to) => {
      return new Promise((resolve, reject) => {
        methods.queries
          .getUserByAddress(address)
          .then((user) => {
            const newVotingPower = to
              ? ethers.BigNumber.from(user.currentVotingPower).add(amount)
              : ethers.BigNumber.from(user.currentVotingPower).sub(amount);
            Users.updateOne(
              { address },
              {
                $set: {
                  currentVotingPower: newVotingPower,
                },
                $push: {
                  delegationHistory: {
                    timestamp: new Date(),
                    amount: newVotingPower,
                  },
                },
              }
            );
          })
          .then((r) => {
            return resolve("done");
          })
          .catch((err) => {
            return reject(err);
          });
      });
    },
  },
};

module.exports = {
  Users,
  methods,
};
