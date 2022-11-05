const getBlockByTimestamp = (provider) => async (timestamp, from) => {
  /// TODO it's better to add a caching layer
  const averageBlockTime = 13000;

  const currentBlock = await provider.getBlock(from);

  const currentTimestamp = currentBlock.timestamp * 1000;

  let guessBlockNumber =
    currentBlock.number -
    parseInt((currentTimestamp - Number(timestamp)) / averageBlockTime);

  let guessBlock = await provider.getBlock(guessBlockNumber);
  let nextBlock = await provider.getBlock(guessBlockNumber + 1);

  do {
    if (
      Number(timestamp) >= guessBlock.timestamp * 1000 &&
      Number(timestamp) <= nextBlock.timestamp * 1000
    ) {
      return guessBlock;
    } else if (Number(timestamp) < guessBlock.timestamp * 1000) {
      guessBlockNumber =
        guessBlockNumber -
        parseInt(
          (guessBlock.timestamp * 1000 - Number(timestamp)) / averageBlockTime
        );
      guessBlock = await provider.getBlock(guessBlockNumber);
      nextBlock = await provider.getBlock(guessBlockNumber + 1);
    } else if (Number(timestamp) > nextBlock.timestamp * 1000) {
      guessBlockNumber =
        guessBlockNumber -
        parseInt(
          (guessBlock.timestamp * 1000 - Number(timestamp)) / averageBlockTime
        );
      guessBlock = await provider.getBlock(guessBlockNumber);
      nextBlock = await provider.getBlock(guessBlockNumber + 1);
    } else {
      break;
    }
  } while (true);
};

module.exports = getBlockByTimestamp;
