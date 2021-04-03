const express = require("express");
// eslint-disable-next-line no-unused-vars
const { MongoClient } = require("mongodb");

const { Leaf, Tree } = require("../lib");

const router = express.Router();

const catchAsync = (f) => (req, res, next) => {
  f(req, res).then(next).catch(next);
};

router.use(
  catchAsync(async (req, res) => {
    /** @type {MongoClient} */
    const client = req.app.locals.client;

    const roots = await client
      .db()
      .collection("merkleTree")
      .find({}, { _id: -1 })
      .toArray();

    res.locals.roots = roots;
  })
);

router.get(
  "/roots",
  catchAsync(async (req, res) => {
    const { roots } = res.locals;
    res.json(roots);
  })
);

router.get(
  "/trees",
  catchAsync(async (req, res) => {
    const { roots } = res.locals;

    const trees = roots.map((treeInfo) => {
      const leafInfos = treeInfo.leafInfos;
      const leaves = leafInfos.map(
        ({ address, amount }) => new Leaf(address, amount)
      );

      const tree = new Tree(leaves);

      if (tree.root.toString("hex") !== treeInfo.root) {
        console.error(`root mismatch`);
        throw new Error("root mismatch");
      }

      return tree;
    });

    res.json(trees);
  })
);

router.get(
  "/amountAndProof",
  catchAsync(async (req, res) => {
    const { roots } = res.locals;
  })
);

router.use((err, req, res, next) => {
  if (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
