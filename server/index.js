const cors = require("cors");
const express = require("express");
const { MongoClient } = require("mongodb");
const mongodbUri = require("mongodb-uri");

require("dotenv").config();

const PORT = process.env.PORT || "17172";

const app = express();
app.use(cors());

app.use("/", require("./controller"));

// DB

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

client
  .connect()
  .then(() => {
    console.log("mongodb connected", uri);

    app.locals.client = client;
    app.listen(PORT, () => {
      console.log("listening port " + PORT);
    });
  })
  .catch((err) => {
    console.error(err);
    throw new Error("failed to connect mongodb");
  });
