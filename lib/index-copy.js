const fs = require("fs");
const fsAsync = fs.promises;
const path = require("path");
const axios = require("axios");

const Leaf = require("./Leaf");
const Tree = require("./Tree");

const CONTENT_FILE_NAME = "data.json";
const TEST_CONTENT_FILE_NAME = "data-test.json";

const CONTENT_FILE_PATH = path.join(__dirname, CONTENT_FILE_NAME);
const TEST_CONTENT_FILE_PATH = path.join(__dirname, TEST_CONTENT_FILE_NAME);

const CONTENT_BASE_URL =
  "https://raw.githubusercontent.com/4000D/whitelisting-contracts/master/lib/";

const CONTENT_URL = CONTENT_BASE_URL + CONTENT_FILE_NAME;
const TEST_CONTENT_URL = CONTENT_BASE_URL + TEST_CONTENT_FILE_NAME;

const sleep = (sec) =>
  new Promise((resolve) => setTimeout(resolve, sec * 1000));

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
  const url = isTest ? TEST_CONTENT_URL : CONTENT_URL;

  const f = async () => {
    const content = await axios.get(url).then((res) => res.data);

    const trees = content.map((treeInfo) => {
      const root = treeInfo.root;
      const leafInfos = treeInfo.leafInfos;
      const leaves = leafInfos.map(
        ({ address, amount }) => new Leaf(address, amount)
      );

      const tree = new Tree(leaves);

      if (tree.root.toString("hex") !== root) {
        console.error(`root mismatch`);
        throw new Error("root mismatch");
      }

      return tree;
    });

    return trees;
  };

  let trees = [];

  while (trees.length === 0) {
    trees = await f().catch(() => []);
    await sleep(0.5);
  }

  return trees;
}

/**
 * @param {Tree[]} trees
 * @param {boolean} isTest
 * @return {Promise<void>}
 */
async function writeContent(trees, isTest = false) {
  const filePath = isTest ? TEST_CONTENT_FILE_PATH : CONTENT_FILE_PATH;

  const content = trees.map((tree) => {
    const root = tree.root.toString("hex");
    const leaves = tree.leaves;
    const leafInfos = leaves.map((leaf) => ({
      address: leaf.getAddressHex(),
      amount: leaf.getAmountBN().toString(10),
    }));

    return { root, leafInfos };
  });

  const data = JSON.stringify(content, null, 2);

  return fsAsync.writeFile(filePath, data);
}

module.exports = {
  Leaf,
  Tree,

  readContent,
  writeContent,
};

if (require && require.main && module && require.main === module) {
  (async () => {
    const isTest = true;

    // await writeContent([Tree.createRandomTree()], isTest);
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
