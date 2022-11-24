const cachedFroms = new Map();

const GetTransactionFrom = (provider) => async (txHash) => {
  if (cachedFroms.get(txHash)) return cachedFroms.get(txHash);
  try {
    const tx = await provider.getTransaction(txHash);
    cachedFroms.set(txHash, tx.from);
    return tx.from;
  } catch (err) {
    console.log(err);
    console.log("retrying ...");
    return GetTransactionFrom(provider)(txHash);
  }
};

module.exports = GetTransactionFrom;
