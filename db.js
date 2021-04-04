require("dotenv").config();
const { MongoClient } = require("mongodb");
const mongodbUri = require("mongodb-uri");

const uri = mongodbUri.format({
  hosts: [{ host: process.env.MONGODB_HOST, port: process.env.MONGODB_PORT }],
  database: process.env.MONGODB_DATABASE,
  username: process.env.MONGODB_USERNAME,
  password: process.env.MONGODB_PASSWORD,
  options: {
    retryWrites: true,
    w: "majority",
    authSource: "admin",
  },
});

const client = new MongoClient(uri, {
  connectTimeoutMS: 5000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = client;
