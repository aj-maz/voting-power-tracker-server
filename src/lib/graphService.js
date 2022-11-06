const { request, gql } = require("graphql-request");

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

const graphqlServer =
  "https://api.thegraph.com/subgraphs/name/ajand/reflexer_flx";

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
  const user = await getUser(userId);

  let pastTimestampBalances = user.balanceHistory
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

  return pastTimestampBalances.at(-1).amount;
};

const main = async () => {
  const user = await getUser("0x00000000000003441d59dde9a90bffb1cd3fabf1");
  console.log(
    await findUserBalanceAtTimestamp(
      "0x00000000003b3cc22af3ae1eac0440bcee416b40",
      new Date("2022-08-12T00:57:37.000Z")
    )
  );
  /// 37820465139578
};

main();
