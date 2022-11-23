require("./mongooseConnector");
const { ethers } = require("ethers");
const config = require("./config.json");

const Admin = require("./models/Admin");

const apiServer = require("./api");

const AddressResolver = require("./lib/AddressResolver");

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);

  console.log(
    "from resolve",
    await AddressResolver("0x4A87a2A017Be7feA0F37f03F3379d43665486Ff8")
  );

  Admin.methods.queries
    .getAll()
    .then((admins) => {
      if (admins.length === 0) {
        Admin.methods.commands
          .create(config.INITIAL_ADMIN, true)
          .then((res) => console.log("super admin created"))
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));

  apiServer(provider);
};

main();
