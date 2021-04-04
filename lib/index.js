const axios = require("axios");

const Leaf = require("./Leaf");
const Tree = require("./Tree");

const BASE_URL = "http://ec2-001.4000d.io:17172/";

axios.default.defaults.baseURL = BASE_URL;

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
 * @param {Tree[]} trees
 * @return {Promise<void>}
 */
async function writeContent(trees) {
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

  return axios.get(`/amountAndProof/${address}`).then((res) => res.data);
}

module.exports = {
  Leaf,
  Tree,

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

    // await writeContent([Tree.createRandomTree()], isTest);
    // return;

    let leaves;

    leaves = [
      new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd0", "100000"),
      new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1", "200000"),
    ];
    await writeContent([new Tree(leaves)], isTest);
    console.log(new Tree(leaves).root.toString("hex"));
    console.log(leaves[0].amount.toString("hex"));
    console.log(leaves[1].amount.toString("hex"));

    leaves = [
      new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd0", "200000"),
      new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2", "300000"),
    ];
    await writeContent([new Tree(leaves)], isTest);
    console.log(new Tree(leaves).root.toString("hex"));
    console.log(leaves[0].amount.toString("hex"));
    console.log(leaves[1].amount.toString("hex"));

    leaves = [
      new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1", "100000"),
      new Leaf("0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2", "100000"),
    ];
    await writeContent([new Tree(leaves)], isTest);
    console.log(new Tree(leaves).root.toString("hex"));
    console.log(leaves[0].amount.toString("hex"));
    console.log(leaves[1].amount.toString("hex"));

    return;

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
