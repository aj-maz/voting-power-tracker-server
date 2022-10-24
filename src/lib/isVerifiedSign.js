const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");

module.exports = ({ signature, publicAddress, nonce }) => {
  /* TODO Need to be implemented */
  const msgBufferHex = ethUtil.bufferToHex(
    Buffer.from(
      `Signin to Voting Tracker Dashboard with nonce: ${nonce}`,
      "utf8"
    )
  );
  const address = sigUtil.recoverPersonalSignature({
    data: msgBufferHex,
    sig: signature,
  });

  if (address.toLowerCase() === publicAddress.toLowerCase()) {
    return true;
  } else {
    return false;
  }
};
