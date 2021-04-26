const axios = require("axios");

const Leaf = require("./Leaf");
const Tree = require("./Tree");

const BASE_URL = "http://ec2-002.4000d.io:17172/";
// const BASE_URL = "https://ec2-002.4000d.io:17173/";

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

      if (n > 0) {
        console.log(`tree#${root} already exists`);
        return;
      }

      console.log(`adding tree#${root}...`);

      const leaves = tree.leaves;
      const leafInfos = leaves.map((leaf) => ({
        address: leaf.getAddressHex(),
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

      console.log(`added tree#${root}...`);
    })
  );
}

/**
 * @param {string} address
 *
 * @return {{
 *  success: boolean,
 *  message?: string,
 *  amount?: BN,
 *  root?: string,
 *  proof?: string,
 * }}
 */
async function getAmountAndProof(address) {
  address = address.toLowerCase().trim();

  return axios
    .get(`/amountAndProof/${address}`)
    .then((res) => res.data)
    .catch((err) => ({ success: false, message: err.message }));
}

module.exports = {
  Leaf,
  Tree,

  writeContent,
  getAmountAndProof,
};

if (require && require.main && module && require.main === module) {
  (async () => {
    let leaves;

    leaves = [
      new Leaf(
        "0x695d5db8e279885C791d07f1a0CCA15C79451B3a",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x7326e37C54C508FaB89bb56F52Ae2a13ac75BBe6",
        "100000000000000000000000"
      ),
      new Leaf(
        "0xE0399Ddf67AdD34FA7B4ED65557145EF99Cf6991",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x806782cB34f3456C2802799A8716007066bdAd85",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x63AA4072218196AFADCb7F0aFCbf3AabEE201c0a",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x1830F4e9dA1a27BB348abb9D38ccfe2c1B54cf72",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x050b246f0E7C08473772b24C8e565B0088BD9eB5",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x9b4557b31914A82D10B99dcA6511FC2BD6bc4833",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x63821644ab71f2765183aBE0eBF0a3d173cC21FD",
        "100000000000000000000000"
      ),
      new Leaf(
        "0x039f4c24f8E2f10599ddC4Bf8d02D14CdA794636",
        "100000000000000000000000"
      ),
    ];
    await writeContent([new Tree(leaves)]);
    console.log(new Tree(leaves).root.toString("hex"));
    return;

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
