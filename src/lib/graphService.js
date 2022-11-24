const { request, gql } = require("graphql-request");
const config = require("../config.json");

const userQuery = gql`
  query user($address: ID!) {
    user(id: $address) {
      id
      balance
      votingPower
      balanceHistory {
        id
        user
        amount
        block {
          number
          at
          id
          totalSupply
        }
      }
      votingPowerHistory {
        id
        user
        amount
        block {
          number
          at
          id
          totalSupply
        }
      }
    }
  }
`;

const graphqlServer = config.SUBGRAPH;

const getUser = async (userAddress) => {
  return request(graphqlServer, userQuery, { address: userAddress }).then(
    (data) => data.user
  );
};

const blockQuery = gql`
  query block($id: ID!) {
    block(id: $id) {
      id
      number
      at
      totalSupply
    }
  }
`;

const getBlock = async (id) => {
  return request(graphqlServer, blockQuery, { id: id }).then(
    (data) => data.block
  );
};

const findUserBalanceAtTimestamp = async (userId, timestamp) => {
  const user = await getUser(userId.toLowerCase());

  const balanceHistory = user.balanceHistory ? user.balanceHistory : [];

  let userBlockNumberBalance = balanceHistory;

  let pastTimestampBalances = userBlockNumberBalance
    .map((bH) => ({
      ...bH,
      block: {
        ...bH.block,
        at: new Date(Number(bH.block.at) * 1000),
        number: Number(bH.block.number),
      },
    }))
    .sort((a, b) => Number(a.block.number) - Number(b.block.number))
    .filter((bH) => {
      return bH.block.at < timestamp;
    });

  return pastTimestampBalances.at(-1);
};

const findUserBalanceAtBlocknumber = async (userId, blockNumber) => {
  const user = await getUser(userId.toLowerCase());

  const balanceHistory = user.balanceHistory ? user.balanceHistory : [];

  let userBlockNumberBalance = balanceHistory
    .map((bH) => ({
      ...bH,
      block: {
        ...bH.block,
        at: new Date(Number(bH.block.at) * 1000),
        number: Number(bH.block.number),
      },
    }))
    .find((bH) => {
      return Number(bH.block.number) == blockNumber;
    });

  return userBlockNumberBalance;
};

const findVotingPowerAtTimestamp = async (userId, timestamp) => {
  const user = await getUser(userId.toLowerCase());

  const votingPowerHistory = user.votingPowerHistory
    ? user.votingPowerHistory
    : [];

  let pastTimestampVotingPower = votingPowerHistory
    .map((bH) => ({
      ...bH,
      block: {
        ...bH.block,
        at: new Date(Number(bH.block.at) * 1000),
        number: Number(bH.block.number),
      },
    }))
    .sort((a, b) => Number(a.block.number) - Number(b.block.number))
    .filter((bH) => {
      return bH.block.at < timestamp;
    });

  return pastTimestampVotingPower.at(-1);
};

const findVotingPowerAtBlocknumber = async (userId, blockNumber) => {
  const user = await getUser(userId.toLowerCase());

  const votingPowerHistory = user.votingPowerHistory
    ? user.votingPowerHistory
    : [];

  let userBlockNumberBalance = votingPowerHistory
    .map((bH) => ({
      ...bH,
      block: {
        ...bH.block,
        at: new Date(Number(bH.block.at) * 1000),
        number: Number(bH.block.number),
      },
    }))
    .find((bH) => {
      return Number(bH.block.number) == blockNumber;
    });

  return userBlockNumberBalance;
};

module.exports = {
  getBlock,
  getUser,
  findUserBalanceAtBlocknumber,
  findUserBalanceAtTimestamp,
  findVotingPowerAtTimestamp,
  findVotingPowerAtBlocknumber,
};
