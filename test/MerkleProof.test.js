const limit = require("p-limit")(16);
const {
  BN,
  constants,
  balance,
  expectEvent,
  expectRevert,
  time,
  send,
  ether,
} = require("@openzeppelin/test-helpers");
const { inTransaction } = require("@openzeppelin/test-helpers/src/expectEvent");

const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const chai = require("chai");

chai.use(require("chai-as-promised"));
chai.use(require("chai-bn")(BN));

const { expect } = chai;

const Leaf = require("../lib/Leaf");
const Tree = require("../lib/Tree");

const MerkleProof = artifacts.require("MerkleProof");
const LeafLib = artifacts.require("LeafLib");

describe("MerkleProof", function () {
  this.timeout(10000000000);

  before(async function () {
    this.merkleProof = await MerkleProof.new();
    this.leafLib = await LeafLib.new();

    // const n = Math.ceil(Math.random() * 1024 + 1);
    // const n = Math.ceil(Math.random() * 12 + 1);
    const n = 4096;

    const leaves = [];

    for (let i = 0; i < n; i++) {
      leaves.push(Leaf.createRandomLeaf());
    }

    const tree = new Tree(leaves);
    const root = tree.root;

    await this.leafLib.addRoot(root);

    /** @member {Leaf[]} */
    this.leaves = leaves;
    /** @member {Tree} */
    this.tree = tree;

    this.root = tree.root;
  });

  it("leaf must be added", async function () {
    let minProofLength = 1000000;
    let maxProofLength = 0;

    for (const leaf of this.leaves) {
      const proof = this.tree.getProof(leaf);
      const root = this.tree.root;

      minProofLength = Math.min(minProofLength, proof.length);
      maxProofLength = Math.max(maxProofLength, proof.length);

      const address = leaf.getAddressHex();
      const amount = leaf.getAmountBN();

      await this.leafLib.addLeaf(root, address, amount, proof);

      expect(await this.leafLib.amounts(address)).to.be.bignumber.equal(amount);

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // await Promise.all(
    //   this.leaves.map(async (leaf) => {
    //     return limit(async () => {
    //       const proof = this.tree.getProof(leaf);
    //       const root = this.tree.root;

    //       minProofLength = Math.min(minProofLength, proof.length);
    //       maxProofLength = Math.max(maxProofLength, proof.length);

    //       const address = leaf.getAddressHex();
    //       const amount = leaf.getAmountBN();

    //       await this.leafLib.addLeaf(root, address, amount, proof);

    //       expect(await this.leafLib.amounts(address)).to.be.bignumber.equal(
    //         amount
    //       );
    //     });
    //   })
    // );

    console.log("minProofLength", minProofLength);
    console.log("maxProofLength", maxProofLength);
  });
});
