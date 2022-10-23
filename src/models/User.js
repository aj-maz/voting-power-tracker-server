const mongoose = require("mongoose");
const { ethers } = require("ethers");

const UserSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
    },
    currentBalance: {
      type: String,
      required: true,
      default: "0",
    },
    currentVotingPower: {
      type: String,
      required: true,
      default: "0",
    },
    currVoteMath: {
      type: Number,
      default: 0,
    },
    delegationHistory: [
      {
        timestamp: Date,
        amount: String,
      },
    ],
    balanceHistory: [
      {
        timestamp: Date,
        amount: String,
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
      //console.log("Transfer user ", address, " ", amount, " ", to);
      return new Promise((resolve, reject) => {
        methods.queries
          .getUserByAddress(address)
          .then((user) => {
            const newBalance = to
              ? ethers.BigNumber.from(user.currentBalance).add(amount)
              : ethers.BigNumber.from(user.currentBalance).sub(amount);

            return Users.updateOne(
              { address },
              {
                $set: {
                  currentBalance: String(newBalance),
                },
                $push: {
                  balanceHistory: {
                    timestamp: new Date(),
                    amount: String(newBalance),
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

    setDelegate: (address, amount) => {
      return new Promise((resolve, reject) => {
        methods.queries
          .getUserByAddress(address)
          .then((user) => {
            console.log({
              timestamp: new Date(),
              amount: String(amount),
            });
            return Users.updateOne(
              { address },
              {
                $set: {
                  currentVotingPower: String(amount),
                  currVoteMath: ethers.BigNumber.from(amount).div(10 ** 10),
                },
                $push: {
                  delegationHistory: {
                    timestamp: new Date(),
                    amount: String(amount),
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
