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
    return [true, Number(relativeDifferencePercent) / 10 ** 10];
  } else {
    return [false, Number(relativeDifferencePercent) / 10 ** 10];
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

  console.log("user absolute diff ====", String(absoulteDiff), amount);
  if (absoulteDiff.gte(amount)) {
    return [true, String(absoulteDiff)];
  } else {
    return [false, String(absoulteDiff)];
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
    return [true, Number(relativeDifferencePercent) / 10 ** 10];
  } else {
    return [false, Number(relativeDifferencePercent) / 10 ** 10];
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
    return [true, String(absoulteDiff)];
  } else {
    return [false, String(absoulteDiff)];
  }
};

const getPrevBalance = async (address, blockNumber) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const refrenceBalance = await findUserBalanceAtBlocknumber(
    address,
    blockNumber - 1
  );

  const amount = refrenceBalance
    ? refrenceBalance.amount
    : (
        await contract.functions.balanceOf(address, {
          blockTag: blockNumber - 1,
        })
      )[0];

  const percent = ethers.BigNumber.from(amount)
    .mul(10 ** 12)
    .div(
      refrenceBalance
        ? ethers.BigNumber.from(refrenceBalance.block.totalSupply)
        : (
            await contract.functions.totalSupply({
              blockTag: blockNumber - 1,
            })
          )[0]
    );

  return {
    amount: Number(ethers.utils.formatEther(amount)).toFixed(5),
    percent: Number(percent) / 10 ** 10,
  };
};

const getBalance = async (address, blockNumber) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const refrenceBalance = await findUserBalanceAtBlocknumber(
    address,
    blockNumber
  );

  const amount = refrenceBalance
    ? refrenceBalance.amount
    : (
        await contract.functions.balanceOf(address, {
          blockTag: blockNumber,
        })
      )[0];

  const percent = ethers.BigNumber.from(amount)
    .mul(10 ** 12)
    .div(
      refrenceBalance
        ? ethers.BigNumber.from(refrenceBalance.block.totalSupply)
        : (
            await contract.functions.totalSupply({
              blockTag: blockNumber,
            })
          )[0]
    );

  return {
    amount: Number(ethers.utils.formatEther(amount)).toFixed(5),
    percent: Number(percent) / 10 ** 10,
  };
};

const getPrevVp = async (address, blockNumber) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const refrenceVP = await findVotingPowerAtBlocknumber(
    address,
    blockNumber - 1
  );

  const amount = refrenceVP
    ? refrenceVP.amount
    : (
        await contract.functions.getCurrentVotes(address, {
          blockTag: blockNumber - 1,
        })
      )[0];

  const percent = ethers.BigNumber.from(amount)
    .mul(10 ** 12)
    .div(
      refrenceVP
        ? ethers.BigNumber.from(refrenceVP.block.totalSupply)
        : (
            await contract.functions.totalSupply({
              blockTag: blockNumber - 1,
            })
          )[0]
    );

  return {
    amount: Number(ethers.utils.formatEther(amount)).toFixed(5),
    percent: Number(percent) / 10 ** 10,
  };
};

const getVp = async (address, blockNumber) => {
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const refrenceVP = await findVotingPowerAtBlocknumber(address, blockNumber);

  const amount = refrenceVP
    ? refrenceVP.amount
    : (
        await contract.functions.getCurrentVotes(address, {
          blockTag: blockNumber,
        })
      )[0];

  const percent = ethers.BigNumber.from(amount)
    .mul(10 ** 12)
    .div(
      refrenceVP
        ? ethers.BigNumber.from(refrenceVP.block.totalSupply)
        : (
            await contract.functions.totalSupply({
              blockTag: blockNumber,
            })
          )[0]
    );

  return {
    amount: Number(ethers.utils.formatEther(amount)).toFixed(5),
    percent: Number(percent) / 10 ** 10,
  };
};

const getAmountPercent = async (amount, address, blockNumber) => {
  console.log("======", amount, address, blockNumber);
  const contract = new ethers.Contract(
    localStorage.getItem("tokenAddress"),
    ReflexerTokenABI,
    provider
  );

  const refrenceVP = await findVotingPowerAtBlocknumber(address, blockNumber);

  const percent = amount.mul(10 ** 12).div(
    refrenceVP
      ? ethers.BigNumber.from(refrenceVP.block.totalSupply)
      : (
          await contract.functions.totalSupply({
            blockTag: blockNumber,
          })
        )[0]
  );

  return {
    amount: Number(ethers.utils.formatEther(String(amount))).toFixed(5),
    percent: Number(percent) / 10 ** 10,
  };
};

module.exports = {
  isUserBalanceChangedAbsolute,
  isUserBalanceChangedRelative,
  isUserDelegateChangedRelative,
  isUserDelegateChangedAbsolute,
  getBalance,
  getPrevBalance,
  getVp,
  getPrevVp,
  getAmountPercent,
};
