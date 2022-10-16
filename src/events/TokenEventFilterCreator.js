const ethers = require("ethers");
const ReflexerTokenABI = require("../contracts/ReflexerToken");

const TokenEventFilterCreator = (provider) => (contractAddress) => {
  const ReflexerTokenContract = new ethers.Contract(
    contractAddress,
    ReflexerTokenABI,
    provider
  );

  const delegateChange = ReflexerTokenContract.filters.DelegateChanged(
    null,
    null,
    null
  );
  const delegateVotesChange =
    ReflexerTokenContract.filters.DelegateVotesChanged(null, null, null);
  const transfer = ReflexerTokenContract.filters.Transfer(null, null, null);
  const mint = ReflexerTokenContract.filters.Mint(null, null);
  const burn = ReflexerTokenContract.filters.Burn(null, null);

  const fils = {
    address: contractAddress,
    topics: [
      [
        ...delegateChange.topics,
        ...delegateVotesChange.topics,
        ...transfer.topics,
        ...mint.topics,
        ...burn.topics,
      ],
    ],
  };

  return fils;
};

module.exports = TokenEventFilterCreator;
