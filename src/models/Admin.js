const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    superAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = mongoose.model("admin", AdminSchema);

const methods = {
  queries: {
    getUserAddress: (address) => {
      return new Promise((resolve, reject) => {
        Admin.findOne({ address }, (err, admin) => {
          if (err) return reject(err);
          return resolve(admin);
        });
      });
    },

    get: (_id) => {
      return new Promise((resolve, reject) => {
        Admin.findOne({ _id }, (err, admin) => {
          if (err) return reject(err);
          return resolve(admin);
        });
      });
    },

    getAll: () => {
      return new Promise((resolve, reject) => {
        Admin.find({ _id }, (err, admins) => {
          if (err) return reject(err);
          return resolve(admins);
        });
      });
    },
  },
  commands: {
    create: (address, superAdmin) => {
      // only super admin can do this
      const admin = new Admin({ address, superAdmin });

      return admin.save();
    },

    delete: (_id) => {
      return new Promise((resolve, reject) => {
        Admin.remove({ _id }, (err, done) => {
          if (err) return reject(err);
          return resolve("done");
        });
      });
    },

    transferSuperPower: (currentSuper, nextSuper) => {
      // only super admin can do this
      return new Promise((resolve, reject) => {
        Admin.updateOne(
          { address: currentSuper },
          { $set: { superAdmin: false } },
          (err, done) => {
            if (err) return reject(err);
            Admin.updateOne(
              { address: nextSuper },
              { $set: { superAdmin: true } },
              (err, done) => {
                if (err) return reject(err);
                return resolve(true);
              }
            );
          }
        );
      });
    },
  },
};

module.exports = {
  Admin,
  methods,
};
