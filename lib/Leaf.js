const Web3EthAbi = require("web3-eth-abi");
const Web3Utils = require("web3-utils");

const crypto = require("crypto");
const { toBuffer, Address, BN } = require("ethereumjs-util");

class Leaf {
  /**
   * @param {string} address hex string
   * @param {string} amount
   */
  constructor(address, amount) {
    /** @member {Address} */
    this.address = Address.fromString(address);

    /** @member {BN} */
    this.amount = new BN(amount);

    const encoded = Web3EthAbi.encodeParameters(
      ["address", "uint256"],
      [this.getAddressHex(), this.amount]
    );

    // /** @member {Buffer} */
    this.hash = toBuffer(Web3Utils.soliditySha3(encoded));
  }

  getAddressHex() {
    return this.address.toString("hex");
  }

  getAmountBN() {
    return this.amount;
  }

  getAmountHex() {
    return "0x" + this.amount.toString("hex");
  }

  getHashHex() {
    return "0x" + this.hash.toString("hex");
  }

  /**
   * @return {Leaf}
   */
  static createRandomLeaf() {
    const address = "0x" + crypto.randomBytes(20).toString("hex");
    const amount = new BN(crypto.randomBytes(20).toString("hex"), "hex");

    return new Leaf(address, amount);
  }
}

module.exports = Leaf;
