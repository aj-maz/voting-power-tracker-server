const ethers = require("ethers");
const ReflexerTokenABI = require("../contracts/ReflexerToken");

const TokenEventFilterCreator = (provider) => (contractAddress) => {
  console.log(contractAddress);
  const ReflexerTokenContract = new ethers.Contract(
    contractAddress,
    ReflexerTokenABI,
    provider
  );

  const priceInAssetUpdated = ReflexerTokenContract.filters.DelegateChanged(
    null,
    null,
    null
  );
  const priceBoundSet = ReflexerTokenContract.filters.DelegateVotesChanged(
    null,
    null,
    null
  );
  const priceFlag = ReflexerTokenContract.filters.Transfer(null, null, null);

  const fils = {
    address: contractAddress,
    topics: [
      [
        ...priceInAssetUpdated.topics,
        ...priceBoundSet.topics,
        ...priceFlag.topics,
      ],
    ],
  };

  return fils;
};

module.exports = TokenEventFilterCreator;
