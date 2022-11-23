const config = require("../config.json");
const { ethers } = require("ethers");

const definedAddress = [
  {
    address: "0xd6F3768E62Ef92a9798E5A8cEdD2b78907cEceF9",
    label: "Uniswap",
  },
];

const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);

const AddressResolver = async (target) => {
  const isDefined = definedAddress.find(
    (addr) => addr.address.toLowerCase() === target.toLowerCase()
  );

  if (isDefined) {
    return isDefined.label;
  }
  const haveENS = await provider.lookupAddress(target.toLowerCase());
  return haveENS;
};

module.exports = AddressResolver;
