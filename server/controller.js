// eslint-disable-next-line no-unused-vars
const { MongoClient } = require("mongodb");
const express = require("express");
const orderBy = require("lodash/orderBy");

const { Leaf, Tree } = require("../lib");

const router = express.Router();

const catchAsync = (f) => (req, res, next) => {
  f(req, res).then(next).catch(next);
};

router.use(
  catchAsync(async (req, res) => {
    /** @type {MongoClient} */
    const client = req.app.locals.client;

    const trees = await client
      .db()
      .collection("merkleTree")
      .find({}, { _id: -1 })
      .toArray();

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

    const { trees } = res.locals;

    const data = trees
      .map((tree) => {
        const leaf = tree.leaves.find(
          (leaf) => leaf.getAddressHex().toLowerCase().trim() === address
        );
        return { tree, leaf };
      })
      .filter((v) => v.leaf);

    if (data.length === 0) {
      return {
        success: false,
      };
    }

    const sortedData = orderBy(data, "leaf.amount", "desc");
    const { tree, leaf } = sortedData[0];

    return {
      success: true,
      root: tree.root.toString("hex"),
      amount: leaf.amount.toString(),
      proof: tree.getProof(leaf),
    };
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
