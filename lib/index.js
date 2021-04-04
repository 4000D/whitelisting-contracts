const fs = require("fs");
const fsAsync = fs.promises;
const path = require("path");
const axios = require("axios");
const orderBy = require("lodash/orderBy");
const Limit = require("p-limit");

const { BN } = require("ethereumjs-util");

const Leaf = require("./Leaf");
const Tree = require("./Tree");

const INDEX_FILE_NAME = "INDEX";
const TEST_INDEX_FILE_NAME = "INDEX_TEST";

const DIR_PATH = path.join(__dirname, "../roots");

const BASE_URL = "http://ec2-001.4000d.io:17172/";

axios.default.defaults.baseURL = BASE_URL;

const getFileURL = (fileName) => BASE_URL + fileName;

const sleep = (sec) =>
  new Promise((resolve) => setTimeout(resolve, sec * 1000));

const limit = Limit(8);

let cache;
/**
 * @typedef {Object} LeafInfo
 * @property {string} LeafInfo.address address of a leaf
 * @property {string} LeafInfo.amount amount of a leaf
 *
 * @typedef {Object} TreeInfo
 * @property {string} TreeInfo.root
 * @property {LeafInfo[]} TreeInfo.leafInfos
 *
 * @typedef {TreeInfo[]} Content
 */

/**
 * @param {boolean} isTest
 * @return {Tree[]} trees
 */
async function readContent(isTest = false) {
  if (cache) return cache;

  const trees = await axios.get("/trees").then((res) => res.data);

  return (cache = trees);
}

/**
 * @param {Tree[]} trees
 * @param {boolean} isTest
 * @return {Promise<void>}
 */
async function writeContent(trees, isTest = false) {
  const client = require("../db");

  await client.connect();

  return Promise.all(
    trees.map(async (tree) => {
      const root = tree.root.toString("hex");

      const n = await client
        .db()
        .collection("merkleTree")
        .countDocuments({ root });
      if (n > 0) return;

      const leaves = tree.leaves;
      const leafInfos = leaves.map((leaf) => ({
        address: leaf.getAddressHex(),
        amount: leaf.getAmountBN().toString(10),
      }));

      const data = { root, leafInfos };
      await client.db().collection("merkleTree").insertOne(data);
    })
  );
}

/**
 * @param {string} address
 * @param {boolean} isTest
 *
 * @return {{
 *  success: boolean,
 *  amount?: BN,
 *  root?: string,
 *  proof?: string,
 * }}
 */
async function getAmountAndProof(address, isTest = false) {
  address = address.toLowerCase().trim();

  const trees = await readContent(isTest);

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
}

module.exports = {
  Leaf,
  Tree,

  readContent,
  writeContent,
  getAmountAndProof,
};

if (require && require.main && module && require.main === module) {
  (async () => {
    const isTest = true;

    // const addresses = [
    //   "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd0",
    //   "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1",
    //   "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2",
    //   "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd3",
    //   "0x61e6b74a12caf97f0b74df079b769d2ecfb75b68",
    // ];

    // for (const address of addresses) {
    //   const res = await getAmountAndProof(address, isTest);
    //   if (res.amount) res.amount = res.amount.toString(10);

    //   console.log(address, res);
    // }

    // return;

    await writeContent([Tree.createRandomTree()], isTest);
    return;

    // let leaves;

    // leaves = [
    //   new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd0", "100000"),
    //   new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1", "200000"),
    // ];
    // await writeContent([new Tree(leaves)], isTest);
    // console.log(new Tree(leaves).root.toString("hex"));
    // console.log(leaves[0].amount.toString("hex"));
    // console.log(leaves[1].amount.toString("hex"));

    // leaves = [
    //   new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd0", "200000"),
    //   new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2", "300000"),
    // ];
    // await writeContent([new Tree(leaves)], isTest);
    // console.log(new Tree(leaves).root.toString("hex"));
    // console.log(leaves[0].amount.toString("hex"));
    // console.log(leaves[1].amount.toString("hex"));

    // leaves = [
    //   new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1", "100000"),
    //   new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2", "100000"),
    // ];
    // await writeContent([new Tree(leaves)], isTest);
    // console.log(new Tree(leaves).root.toString("hex"));
    // console.log(leaves[0].amount.toString("hex"));
    // console.log(leaves[1].amount.toString("hex"));

    // return;

    const trees = await readContent(isTest);

    console.log("previous trees");
    trees.forEach((tree) => {
      console.log(tree.root);
    });
    console.log();

    const newTree = Tree.createRandomTree();
    console.log("new tree");
    console.log(newTree.root);

    trees.push(newTree);

    await writeContent(trees, isTest);
  })().catch((err) => {
    console.error(err);
  });
}
