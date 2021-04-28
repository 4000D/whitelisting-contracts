const cors = require("cors");
const express = require("express");

require("dotenv").config();

const client = require("../db");

const PORT = process.env.PORT || "17172";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", require("./controller"));

client
  .connect()
  .then(() => {
    console.log("mongodb connected");

    app.locals.client = client;
    app.listen(PORT, () => {
      console.log("listening port " + PORT);
    });
  })
  .catch((err) => {
    console.error(err);
    throw new Error("failed to connect mongodb");
  });
