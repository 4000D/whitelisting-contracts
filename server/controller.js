// eslint-disable-next-line no-unused-vars
const { MongoClient } = require("mongodb");
const express = require("express");
const { toBN } = require("web3-utils");
const orderBy = require("lodash/orderBy");

const { Leaf, Tree } = require("../lib");

const router = express.Router();

const catchAsync = (f) => (req, res, next) => {
  f(req, res)
    .then(() => next())
    .catch(next);
};

router.use(
  catchAsync(async (req, res) => {
    /** @type {MongoClient} */
    const client = req.app.locals.client;

    const n = await client.db().collection("merkleTree").countDocuments({});

    if (res.locals.trees && res.locals.trees.length === n) {
      next();
      return;
    }

    /** @type {Tree[]} */
    const merkleTrees = await client
      .db()
      .collection("merkleTree")
      .find({}, { _id: -1 })
      .toArray();

    const trees = merkleTrees
      .map(({ root = "", leafInfos = [] }) => {
        if (!root || leafInfos.length === 0) return null;

        const leaves = leafInfos.map(
          ({ address, amount }) => new Leaf(address, amount)
        );

        const tree = new Tree(leaves);

        if (root !== tree.root.toString("hex")) return null;
        return tree;
      })
      .filter((v) => v);

    res.locals.trees = trees;
  })
);

// router.get(
//   "/trees",
//   catchAsync(async (req, res) => {
//     const { trees } = res.locals;

//     const trees = trees.map((treeInfo) => {
//       const leafInfos = treeInfo.leafInfos;
//       const leaves = leafInfos.map(
//         ({ address, amount }) => new Leaf(address, amount)
//       );

//       const tree = new Tree(leaves);

//       if (tree.root.toString("hex") !== treeInfo.root) {
//         console.error(`root mismatch`);
//         throw new Error("root mismatch");
//       }

//       return tree;
//     });

//     res.json(trees);
//   })
// );

router.get(
  "/amountAndProof/:address",
  catchAsync(async (req, res) => {
    const address = req.params.address.toLowerCase().trim();

    const addressDoc = await client.db().collection("address").findOne({address});
    
    if (!addressDoc) {
      res.json({success: false});
      return;
    }

    const targetRoots = addressDoc.root;
    const targetRootsSet = new Set(targetRoots);

    /** @type {Tree[]} */
    const { trees } = res.locals;

    const data = trees
      .filter(tree => targetRootsSet.has(tree.root.toString("hex")))
      .map((tree) => {
        const leaf = tree.leaves.find(
          (leaf) => leaf.getAddressHex().toLowerCase().trim() === address
        );
        return { tree, leaf };
      })
      .filter((v) => v.leaf);

    if (data.length === 0) {
      return res.json({
        success: false,
      });
    }

    const sortedData = orderBy(data, ({ leaf }) => leaf.getAmountHex(), "desc");
    const { tree, leaf } = sortedData[0];

    return res.json({
      success: true,
      root: tree.root.toString("hex"),
      amount: leaf.amount.toString(),
      proof: tree.getProof(leaf),
    });
  })
);

router.use((err, req, res, next) => {
  if (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
    return next(err);
  }
  next();
});

module.exports = router;
