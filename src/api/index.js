const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Fetcher = require("../models/Fetcher");
const Processor = require("../models/Processor");
const { query } = require("../models/Events");

const config = require("../config.json");

const isVerifiedSign = require("../lib/isVerifiedSign");

const apiServer = async () => {
  const typeDefs = `#graphql
    type Admin {
        _id: ID!
        address: String
        superAdmin: Boolean
        nonce: Int
    }

    type FetchingData {
      status: Int!
      tokenAddress: String
      tokenCreationBlock: String
      lastFetchedBlock: String
    }

    type Events {
      items: [Event!]!
      count: Int!
    }

    type Event {
      name: String!
      blockNumber: Int!
      transactionHash: String!
      processed: Boolean!
    }

    type Processor {
      status: Int!
      processed: Int
      fetched: Int
      lastProcessedBlock: String
      alertSettings: String
      processFrom: String
    }
  
    type Query {
        admins: [Admin!]!
        me: Admin
        fetcher: FetchingData!
        events(limit: Int!, offset: Int!): Events!
        processor: Processor!
    }

    type Mutation {
        getNonce(address: String!): Int
        getToken(address: String!, signature: String!): String!
        addAdmin(address: String!): String!
        deleteAdmin(targetAddress: String!): String!
        changeSuperAdmin(targetAddress: String!): String!
        
        # Fetcher Methods
        startFetching(tokenAddress: String!, tokenCreationBlock: String!): String!
        pauseFetching: String!
        resumeFetching: String!
        resetFetching: String!

        # Processor Methods
        startProcessing: String!
        pauseProcessing: String!
        resumeProcessing: String!
        resetProcessing: String!
    }
  `;

  const resolvers = {
    Query: {
      admins: Admin.methods.queries.getAll,
      me: (_, {}, { address }) => {
        return Admin.methods.queries.getAdminByAddress(address);
      },
      fetcher: () => {
        return Fetcher.get();
      },
      events: (_, { limit, offset }) => {
        return query({ limit, offset });
      },
      processor: () => {
        return Processor.get();
      },
    },

    Mutation: {
      getNonce: (_, { address }) => {
        return Admin.methods.queries
          .getAdminByAddress(address)
          .then((admin) => {
            if (admin) return admin.nonce;
            if (!admin) {
              throw new Error("Not an admin!");
            }
          })
          .catch((err) => err);
      },

      getToken: (_, { signature, address }) => {
        return Admin.methods.queries
          .getAdminByAddress(address)
          .then((admin) => {
            // TODO verification need to be implemented
            Admin.methods.commands
              .setNewNonce(address)
              .then(() => console.log("renonced"))
              .catch((err) => console.log(err));
            if (
              isVerifiedSign({
                signature,
                publicAddress: address,
                nonce: admin.nonce,
              })
            ) {
              return jwt.sign(
                {
                  _id: admin._id,
                  address: admin.address,
                  superAdmin: admin.superAdmin,
                },
                config.JWT_SECRET
              );
            } else {
              return new Error("Wrong signature");
            }
          })
          .catch((err) => {
            throw new Error(err);
          });
      },

      addAdmin: (_, { address }, { superAdmin }) => {
        if (!superAdmin) {
          throw new Error("Only super admin can");
        }
        return Admin.methods.commands
          .create(address, false)
          .then((a) => "Admin Created.")
          .catch((err) => err);
      },

      deleteAdmin: (_, { targetAddress }, { superAdmin, address }) => {
        if (!superAdmin) {
          throw new Error("Only super admin can");
        }
        if (targetAddress.toLowerCase() === address.toLowerCase()) {
          throw new Error("Can not delete super admin.");
        }
        return Admin.methods.commands
          .delete(targetAddress)
          .then((a) => "Admin deleted.")
          .catch((err) => err);
      },

      changeSuperAdmin: (_, { targetAddress }, { superAdmin, address }) => {
        if (!superAdmin) {
          throw new Error("Only super admin can");
        }
        return Admin.methods.commands
          .transferSuperPower(address, targetAddress)
          .then((a) => "Super Admin Changed.")
          .catch((err) => err);
      },

      startFetching: (_, { tokenAddress, tokenCreationBlock }) => {
        return Fetcher.start({ tokenAddress, tokenCreationBlock });
      },
      pauseFetching: () => {
        return Fetcher.pause();
      },
      resumeFetching: () => {
        return Fetcher.resume();
      },
      resetFetching: () => {
        return Fetcher.reset();
      },

      startProcessing: () => {
        return Processor.start();
      },

      pauseProcessing: () => {
        return Processor.pause();
      },

      resumeProcessing: () => {
        return Processor.resume();
      },

      resetProcessing: () => {
        return Processor.reset();
      },
    },
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: ({ req }) => {
      const token = req.headers.authorization || "";

      if (!token) return {};

      // Try to retrieve a user with the token

      const decode = jwt.verify(token, config.JWT_SECRET);

      const userId = decode._id;

      return { ...decode };
    },
  });

  console.log(`🚀  Server ready at: ${url}`);
};

module.exports = apiServer;
