const getBlockByTimestamp = require("./getBlockByTimestamp");
const getTotalSupplyAtBlock = require("./getTotalSupplyAtBlock");
const { ethers } = require("ethers");
const config = require("../config.json");
const LocalStorage = require("node-localstorage").LocalStorage;
const path = require("path");
const ReflexerTokenABI = require("../contracts/ReflexerToken");
const {
  findUserBalanceAtBlocknumber,
  findUserBalanceAtTimestamp,
  findVotingPowerAtBlocknumber,
  findVotingPowerAtTimestamp,
} = require("./graphService");

const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};

const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);

const isUserDelegateChangedRelative = async (
  { blockNumber, happenedAt },
  address,
  { percent, timeframe }
) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const currentVotingPower = (await findVotingPowerAtBlocknumber(
    address,
    blockNumber
  ))
    ? (await findVotingPowerAtBlocknumber(address, blockNumber)).amount
    : (
        await contract.functions.getCurrentVotes(address, {
          blockTag: blockNumber,
        })
      )[0];

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);

  const refrenceVotingPower = await findVotingPowerAtTimestamp(
    address,
    refrenceTime
  );

  // Find the relative difference
  const relativeDifferencePercent = ethers.BigNumber.from(currentVotingPower)
    .mul(10 ** 12)
    .sub(
      ethers.BigNumber.from(
        refrenceVotingPower ? refrenceVotingPower.amount : 0
      ).mul(10 ** 12)
    )
    .div(
      ethers.BigNumber.from(
        refrenceVotingPower
          ? refrenceVotingPower.block.totalSupply
          : (
              await contract.functions.totalSupply({
                blockTag: blockNumber,
              })
            )[0]
      )
    );

  if (
    relativeDifferencePercent.gte(ethers.BigNumber.from(percent * 10 ** 12))
  ) {
    return Number(relativeDifferencePercent) / 10 ** 10;
  } else {
    return false;
  }
};

const isUserDelegateChangedAbsolute = async (
  { blockNumber, happenedAt },
  address,
  { amount, timeframe }
) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const currentVotingPower = (await findVotingPowerAtBlocknumber(
    address,
    blockNumber
  ))
    ? (await findVotingPowerAtBlocknumber(address, blockNumber)).amount
    : (
        await contract.functions.getCurrentVotes(address, {
          blockTag: blockNumber,
        })
      )[0];

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);

  const refrenceVotingPower = await findVotingPowerAtTimestamp(
    address,
    refrenceTime
  ).amount;

  const absoulteDiff = ethers.BigNumber.from(currentVotingPower).sub(
    ethers.BigNumber.from(refrenceVotingPower ? refrenceVotingPower : 0)
  );
  if (absoulteDiff >= amount) {
    return String(absoulteDiff);
  } else {
    return false;
  }
};

const isUserBalanceChangedRelative = async (
  { blockNumber, happenedAt },
  address,
  { percent, timeframe }
) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const currentBalance = (await findUserBalanceAtBlocknumber(
    address,
    blockNumber
  ))
    ? (await findUserBalanceAtBlocknumber(address, blockNumber)).amount
    : (
        await contract.functions.balanceOf(address, {
          blockTag: blockNumber,
        })
      )[0];

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);

  const refrenceBalance = await findUserBalanceAtTimestamp(
    address,
    refrenceTime
  );

  // Find the relative difference
  const relativeDifferencePercent = ethers.BigNumber.from(currentBalance)
    .mul(10 ** 12)
    .sub(
      ethers.BigNumber.from(refrenceBalance ? refrenceBalance.amount : 0).mul(
        10 ** 12
      )
    )
    .div(
      refrenceBalance
        ? ethers.BigNumber.from(refrenceBalance.block.totalSupply)
        : (
            await contract.functions.totalSupply({
              blockTag: blockNumber,
            })
          )[0]
    );

  // Calculate the percentage
  if (
    relativeDifferencePercent.gte(ethers.BigNumber.from(percent * 10 ** 12))
  ) {
    return Number(relativeDifferencePercent) / 10 ** 10;
  } else {
    return false;
  }
};

const isUserBalanceChangedAbsolute = async (
  { blockNumber, happenedAt },
  address,
  { amount, timeframe }
) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const currentBalance = (await findUserBalanceAtBlocknumber(
    address,
    blockNumber
  ))
    ? (await findUserBalanceAtBlocknumber(address, blockNumber)).amount
    : (
        await contract.functions.balanceOf(address, {
          blockTag: blockNumber,
        })
      )[0];

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);

  const refrenceBalance = (await findUserBalanceAtTimestamp(
    address,
    refrenceTime
  ))
    ? (await findUserBalanceAtTimestamp(address, refrenceTime)).amount
    : 0;

  const absoulteDiff = ethers.BigNumber.from(currentBalance).sub(
    ethers.BigNumber.from(refrenceBalance)
  );
  if (absoulteDiff >= amount) {
    return String(absoulteDiff);
  } else {
    return false;
  }
};

module.exports = {
  isUserBalanceChangedAbsolute,
  isUserBalanceChangedRelative,
  isUserDelegateChangedRelative,
  isUserDelegateChangedAbsolute,
};
