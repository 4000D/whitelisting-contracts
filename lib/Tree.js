const { default: MerkleTree, checkProof } = require("merkle-tree-solidity");

const Leaf = require("./Leaf");

const preserveOrder = false;

class Tree {
  /**
   *
   * @param {Leaf[]} leaves
   */
  constructor(leaves) {
    /** @member {Leaf[]} */
    this.leaves = leaves;

    /** @member {MerkleTree} */
    this.tree = new MerkleTree(
      this.leaves.map((l) => l.hash),
      preserveOrder
    );

    this.root = this.tree.getRoot();
  }

  static createRandomTree() {
    const n = Math.ceil(Math.random() * 1024 + 1);

    const leaves = [];

    for (let i = 0; i < n; i++) {
      leaves.push(Leaf.createRandomLeaf());
    }

    return new Tree(leaves);
  }

  /**
   * @param {Leaf} leaf
   * @return {string} joined hex string
   */
  getProof(leaf) {
    const proof = this.tree.getProof(leaf.hash);
    return "0x" + proof.map((p) => p.toString("hex")).join("");
  }

  /**
   * @param {Leaf} leaf
   * @return {Buffer[]}
   */
  getProofRaw(leaf) {
    return this.tree.getProof(leaf.hash);
  }
}

module.exports = Tree;

if (require.main === module) {
  const n = Math.ceil(Math.random() * 1024 + 1);

  const leaves = [];

  for (let i = 0; i < n; i++) {
    leaves.push(Leaf.createRandomLeaf());
  }

  const tree = new Tree(leaves);

  const root = tree.root;

  for (const leaf of leaves) {
    const proof = tree.getProofRaw(leaf);

    const c = checkProof(proof, root, leaf.hash);
    if (!c) {
      throw new Error("no wap");
    }

    console.log(`${leaf.hash.toString("hex")} checked`);
  }

  // console.log(t);
}
