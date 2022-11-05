const { ethers } = require("ethers");
const ReflexerTokenABI = require("../contracts/ReflexerToken");

const getTotalSupplyAtBlock =
  (provider, contractAddress) => async (blockNumber) => {
    const contract = new ethers.Contract(
      contractAddress,
      ReflexerTokenABI,
      provider
    );

    const totalSupply = await contract.functions.totalSupply({
      blockTag: blockNumber,
    });

    return totalSupply;
  };

module.exports = getTotalSupplyAtBlock;
