const axios = require("axios");

const Leaf = require("./Leaf");
const Tree = require("./Tree");

const BASE_URL = "http://ec2-001.4000d.io:8080/";

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
    const isTest = true;

    const addresses = [
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
      "0x066184fa5bec94218d71ea5324a972e079bec641",
      "0x8019c0e82a7bf1e70c71c581a62648f829e564a2",
      "0x2e058d8fea29f39c33c1efd39b85c4a9d8163488",
      "0x1ce3ad9d1206e7cf0c1ccc0d5cae8f4185c33b7d",
      "0x26a9e14045e93d0aa2dc3b3c7a798639b62a0a94",
      "0x3488cfc16e73eb742ec319bbb316f9768740ce49",
      "0xb2f23b189bf0256eed4a1316baa8e105f0098498",
      "0x55fa96493ecb9ffdbc3effe98583d2ae66ce0e4b",
      "0x237a3434471d88ba20705c026033adf16903992e",
      "0xf9b5bfe8fd0376b4b6d142b1950262e6a9e91700",
    ];

    console.log("starting..");
    // for (const address of addresses) {

    await Promise.all(
      addresses.map(async (address) => {
        console.time(address);
        const res = await getAmountAndProof(address);
        console.timeEnd(address);
        console.log(address, "finished", res);
      })
    );

    // }
    console.log("finished");

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
