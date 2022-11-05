const getBlockByTimestamp = require("./getBlockByTimestamp");
const getTotalSupplyAtBlock = require("./getTotalSupplyAtBlock");
const { ethers } = require("ethers");
const config = require("../config.json");
const LocalStorage = require("node-localstorage").LocalStorage;
const path = require("path");
const ReflexerTokenABI = require("../contracts/ReflexerToken");

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

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);
  //Get timeframe ago block
  const refrenceBlock = await getBlockByTimestamp(provider)(
    refrenceTime,
    blockNumber
  );
  // Get total supply at current block
  const totalSupplyAtCurrentBlock = await getTotalSupplyAtBlock(
    provider,
    localStorage.getItem("tokenAddress")
  )(blockNumber);

  // Get Voting power at refrence block
  const refrenceVotes = await contract.functions.getCurrentVotes(address, {
    blockTag: refrenceBlock.number,
  });
  // Get Voting power at current blocktem("tokenAddress")
  const currentVotes = await contract.functions.getCurrentVotes(address, {
    blockTag: blockNumber,
  });

  // Find the relative difference
  const relativeDifference =
    (currentVotes - refrenceVotes) / totalSupplyAtCurrentBlock;
  // Calculate the percentage
  if (relativeDifference * 100 >= percent) {
    return relativeDifference * 100;
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

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);
  //Get timeframe ago block
  const refrenceBlock = await getBlockByTimestamp(provider)(
    refrenceTime,
    blockNumber
  );

  // Get Voting power at refrence block
  const refrenceVotes = await contract.functions.getCurrentVotes(address, {
    blockTag: refrenceBlock.number,
  });
  // Get Voting power at current block
  const currentVotes = await contract.functions.getCurrentVotes(address, {
    blockTag: blockNumber,
  });

  // Find the relative difference
  const absoulteDiff = currentVotes - refrenceVotes;
  // Calculate the percentage
  if (absoulteDiff >= amount) {
    return absoulteDiff;
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

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);
  //Get timeframe ago block
  const refrenceBlock = await getBlockByTimestamp(provider)(
    refrenceTime,
    blockNumber
  );
  // Get total supply at current block
  const totalSupplyAtCurrentBlock = await getTotalSupplyAtBlock(
    provider,
    localStorage.getItem("tokenAddress")
  )(blockNumber);

  // Get Balance at refrence block
  const refrenceBalance = await contract.functions.balanceOf(address, {
    blockTag: refrenceBlock.number,
  });
  // Get Balannce at current block
  const currentBalance = await contract.functions.balanceOf(address, {
    blockTag: blockNumber,
  });

  // Find the relative difference
  const relativeDifference =
    (currentBalance - refrenceBalance) / totalSupplyAtCurrentBlock;
  // Calculate the percentage
  if (relativeDifference * 100 >= percent) {
    return relativeDifference * 100;
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

  const refrenceTime = new Date(happenedAt).addHours(-1 * timeframe);
  console.log("refrence Time: ", refrenceTime);
  //Get timeframe ago block
  /* const refrenceBlock = await getBlockByTimestamp(provider)(
    refrenceTime,
    blockNumber
  );

  console.log("refrence block: ", refrenceBlock);

  // Get Balance at refrence block
  const refrenceBalance = await contract.functions.balanceOf(address, {
    blockTag: refrenceBlock.number,
  }); */
  //
  //console.log("refrence balance: ", refrenceBalance);

  // Get Balannce at current block
  console.log("start to get current balance");
  const currentBalance = await contract.balanceOf(address, {
    blockTag: blockNumber,
  });

  console.log("current balance: ", currentBalance);

  // Find the relative difference
  //const absoulteDiff = currentBalance - refrenceBalance;
  //console.log("absolute diff: ", absoulteDiff);
  // Calculate the percentage
  /* if (absoulteDiff >= amount) {
    return absoulteDiff;
  } else {
    return false;
  } */
};

module.exports = {
  isUserBalanceChangedAbsolute,
  isUserBalanceChangedRelative,
  isUserDelegateChangedRelative,
  isUserDelegateChangedAbsolute,
};
