const { toWei } = require("web3-utils");

const { Leaf, Tree, writeContent } = require("../lib");

const data = [
  // test tree data 1
  [
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1", "10.0"],
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2", "10.1"],
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd3", "10.2"],
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd4", "10.3"],
  ],
  // futuer trees..
  [
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd1", "11.0"],
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd2", "11.1"],
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd3", "11.2"],
    ["0x2ee663dc151d8f0ea5ad51a1fbd4998840c63cd4", "11.3"],
  ],
  // futuer trees..
];

(async () => {
  const trees = data.map((rows) => {
    const leaves = rows.map((row) => {
      const address = row[0].trim();
      const amount = toWei(row[1].trim(), "ether");
      return new Leaf(address, amount);
    });

    return new Tree(leaves);
  });

  trees.push(Tree.createRandomTree());
  trees.push(Tree.createRandomTree());
  trees.push(Tree.createRandomTree());
  trees.push(Tree.createRandomTree());
  trees.push(Tree.createRandomTree());
  trees.push(Tree.createRandomTree());
  trees.push(Tree.createRandomTree());

  trees[trees.length - 1].leaves
    .slice(-10)
    .map((l) => l.getAddressHex())
    .forEach(console.log);

  await writeContent(trees);

  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(-1);
});
