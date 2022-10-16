const cachedTimestmaps = new Map();

const GetBlockTimestamp = (provider) => async (blockNumber) => {
  if (cachedTimestmaps.get(blockNumber))
    return cachedTimestmaps.get(blockNumber);
  try {
    const block = await provider.getBlock(blockNumber);
    const timestamp = block.timestamp * 1000;
    cachedTimestmaps.set(blockNumber, timestamp);
    return timestamp;
  } catch (err) {
    console.log(err);
    console.log("retrying ...");
    return GetBlockTimestamp(provider)(blockNumber);
  }
};

module.exports = GetBlockTimestamp;
