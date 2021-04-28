const { default: MerkleTree } = require("merkle-tree-solidity");
const { appendHexPrefix } = require("./prefix");

const Leaf = require("./Leaf");

const preserveOrder = false;

class Tree {
  /**
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

  /**
   * @param {{address: string, amount: string}[]} rl
   */
  static fromRawLeaves(rl) {
    const arr = typeof rl === "object" ? rl : JSON.parse(rl);
    const leaves = arr.map(({ address, amount }) => new Leaf(address, amount));
    return new Tree(leaves);
  }

  static createRandomTree() {
    const n = Math.ceil(Math.random() * 1024 + 1);

    const leaves = [];

    for (let i = 0; i < n; i++) {
      leaves.push(Leaf.createRandomLeaf());
    }

    return new Tree(leaves);
  }

  getRootHex() {
    return appendHexPrefix(this.root.toString("hex"));
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
