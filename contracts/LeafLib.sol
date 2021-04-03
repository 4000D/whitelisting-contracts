// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import {MerkleProof} from "./lib/MerkleProof.sol";

contract LeafLib is MerkleProof {
    mapping(address => uint256) public amounts;
    mapping(bytes32 => bool) public isRoot;
    bytes32[] public roots;

    function addRoot(bytes32 root) external {
        require(!isRoot[root]);
        isRoot[root] = true;
        roots.push(root);
    }

    function getHash(address account, uint256 amount)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(account, amount));
    }

    function addLeaf(
        bytes32 root,
        address account,
        uint256 amount,
        bytes calldata proof
    ) external {
        require(isRoot[root], "no-root");

        bytes32 acb = addressToBytes32(account);
        bytes32 amb = uint256ToBytes32(amount);

        bytes32 h = getHash(account, amount);

        require(checkProof(proof, root, h), "invalid-proof");

        amounts[account] = amount;
    }

    function addressToBytes32(address a) public pure returns (bytes32) {
        return bytes32(bytes20(a));
    }

    function bytes32ToAddress(bytes32 b) public pure returns (address) {
        return address(uint160(bytes20(b)));
    }

    function bytes32Touint256(bytes32 b) public pure returns (uint256) {
        return uint256(b);
    }

    function uint256ToBytes32(uint256 i) public pure returns (bytes32) {
        return bytes32(i);
    }
}
