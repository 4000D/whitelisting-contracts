// eslint-disable-next-line no-unused-vars
const { MongoClient } = require("mongodb");
const express = require("express");
const { toBN } = require("web3-utils");
const orderBy = require("lodash/orderBy");
const zipObject = require("lodash/zipObject");
const { isValidAddress } = require("ethereumjs-util");

const { Leaf, Tree } = require("../lib");
const { appendHexPrefix, DEFAULT_AMOUNT } = require("../lib");

const router = express.Router();

const catchAsync = (f) => (req, res, next) => {
  f(req, res)
    .then(() => next())
    .catch(next);
};

router.use(
  catchAsync(async (req, res, next) => {
    /** @type {MongoClient} */
    const client = req.app.locals.client;

    const n = await client.db().collection("merkleTree").countDocuments({});

    if (req.app.locals.trees && req.app.locals.trees.length === n) {
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

    req.app.locals.trees = trees;
  })
);

router.get("/roots", (req, res) => {
  const { trees } = req.app.locals;
  res.json({
    success: true,
    roots: trees.map((tree) => tree.getRootHex()),
  });
});

router.get(
  "/roots/:root",
  catchAsync(async (req, res) => {
    const root = appendHexPrefix(req.params.root);
    const { trees } = req.app.locals;
    const tree = trees.find((tree) => tree.getRootHex() === root);

    if (!tree) {
      return res.json({ success: false, message: `Unknown root: ${root}` });
    }

    return res.json({
      success: true,
      accounts: tree.leaves.map((leaf) => leaf.getAddressHex()),
    });
  })
);

// router.get(
//   "/trees",
//   catchAsync(async (req, res) => {
//     const { trees } = req.app.locals;

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
    const client = req.app.locals.client;

    const address = req.params.address.toLowerCase().trim();

    const addressDoc = await client
      .db()
      .collection("address")
      .findOne({ address });

    if (!addressDoc) {
      return res.json({
        success: false,
        message: `Unknown address: ${address}`,
      });
    }

    const targetRoots = addressDoc.root;
    const rootIndex = addressDoc.index;
    const targetRootsSet = new Set(targetRoots);

    const indexMap = zipObject(targetRoots, rootIndex);

    /** @type {Tree[]} */
    const { trees } = req.app.locals;

    const data = trees
      .filter((tree) => targetRootsSet.has(tree.root.toString("hex")))
      .map((tree) => {
        const leafIndex = indexMap[tree.root.toString("hex")];
        const leaf = tree.leaves[leafIndex];
        if (leaf.getAddressHex() !== address) {
          console.error("invalid leaf");
          return null;
        }
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
      root: "0x" + tree.root.toString("hex"),
      amount: leaf.amount.toString(),
      proof: tree.getProof(leaf),
    });
  })
);

router.post(
  "/accounts",
  catchAsync(async (req, res) => {
    const { accounts = [] } = req.body;

    /** @type {MongoClient} */
    const client = req.app.locals.client;

    if (accounts.length === 0) {
      return res.json({
        success: false,
        message: "accounts must be non-empty array",
      });
    }

    for (const account of accounts) {
      if (!isValidAddress(account)) {
        return res.json({
          success: false,
          message: `account ${account} is not valid address`,
        });
      }
    }

    /** @type {Leaf[]} */
    const leaves = accounts.map(
      (account) => new Leaf(account, toBN(DEFAULT_AMOUNT))
    );

    const tree = new Tree(leaves);

    const root = tree.root.toString("hex");

    const n = await client
      .db()
      .collection("merkleTree")
      .countDocuments({ root });

    if (n > 0) {
      return res.json({
        success: false,
        message: `tree already exists`,
        root: appendHexPrefix(root),
      });
    }

    const leafInfos = leaves.map((leaf) => ({
      address: leaf.getAddressHex().toLowerCase(),
      amount: leaf.getAmountBN().toString(10),
    }));

    const data = { root, leafInfos };
    await client.db().collection("merkleTree").insertOne(data);

    await Promise.all(
      leaves.map((leaf, index) => {
        const address = leaf.getAddressHex().toLowerCase();
        return client.db().collection("address").findOneAndUpdate(
          { address },
          {
            $push: {
              root,
              index,
            },
          },
          { upsert: true }
        );
      })
    );

    return res.json({
      success: true,
      root: appendHexPrefix(root),
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
