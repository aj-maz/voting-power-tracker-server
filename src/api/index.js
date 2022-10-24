const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

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
  
    type Query {
        admins: [Admin!]!
    }

    type Mutation {
        getNonce(address: String!): Int
        getToken(address: String!, signature: String!): String!
    }
  `;

  const resolvers = {
    Query: {
      admins: Admin.methods.queries.getAll,
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

      return { userId };
    },
  });

  console.log(`🚀  Server ready at: ${url}`);
};

module.exports = apiServer;
