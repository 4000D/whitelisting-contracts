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

const ROOTS_BASE_URL =
  "https://raw.githubusercontent.com/4000D/whitelisting-contracts/master/roots/";

const getFileURL = (fileName) => ROOTS_BASE_URL + fileName;

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

  const indexFileName = isTest ? TEST_INDEX_FILE_NAME : INDEX_FILE_NAME;
  const indexUrl = getFileURL(indexFileName);

  const f = async () => {
    const index = await axios.get(indexUrl).then((res) => res.data.trim());

    const roots = index.split("\n");

    const trees = await Promise.all(
      roots.map((root) =>
        limit(async () => {
          const rootUrl = getFileURL(root);
          const treeInfo = await axios.get(rootUrl).then((res) => res.data);

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
        })
      )
    );

    return trees;
  };

  let trees = [];

  while (trees.length === 0) {
    trees = await f().catch((err) => {
      console.error(err.response.data);
      return [];
    });
    await sleep(0.5);
  }

  return (cache = trees);
}

/**
 * @param {Tree[]} trees
 * @param {boolean} isTest
 * @return {Promise<void>}
 */
async function writeContent(trees, isTest = false) {
  const indexFileName = isTest ? TEST_INDEX_FILE_NAME : INDEX_FILE_NAME;
  const indexFilePath = path.join(DIR_PATH, indexFileName);

  if (!fs.existsSync(indexFilePath)) {
    fs.writeFileSync(indexFilePath, "", { encoding: "utf8" });
  }

  const roots = trees.map((tree) => tree.root.toString("hex"));
  const previousRoots = (await fsAsync.readFile(indexFilePath, "utf-8")).split(
    "\n"
  );

  const previousRootsSet = new Set(previousRoots);

  const targetRoots = roots.filter((root) => !previousRootsSet.has(root));

  await Promise.all(
    targetRoots.map(async (root) => {
      await fsAsync.writeFile(indexFilePath, root + "\n", { flag: "a" });
    })
  );

  await Promise.all(
    trees.map((tree) =>
      limit(async () => {
        const root = tree.root.toString("hex");
        const rootFilePath = path.join(DIR_PATH, root);
        if (fs.existsSync(rootFilePath)) return;

        const leaves = tree.leaves;
        const leafInfos = leaves.map((leaf) => ({
          address: leaf.getAddressHex(),
          amount: leaf.getAmountBN().toString(10),
        }));

        const data = { root, leafInfos };
        return fsAsync.writeFile(rootFilePath, JSON.stringify(data, null, 2));
      })
    )
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

    const addresses = [
      "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd0",
      "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1",
      "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2",
      "0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd3",
      "0x61e6b74a12caf97f0b74df079b769d2ecfb75b68",
    ];

    for (const address of addresses) {
      const res = await getAmountAndProof(address, isTest);
      if (res.amount) res.amount = res.amount.toString(10);

      console.log(address, res);
    }

    return;

    // await writeContent([Tree.createRandomTree()], isTest);
    // return;

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
