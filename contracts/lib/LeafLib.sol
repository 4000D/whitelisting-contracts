// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import {MerkleProof} from "./MerkleProof.sol";

contract LeafLib is MerkleProof {
    mapping(address => uint256) public amounts;
    mapping(bytes32 => bool) public isRoot;
    bytes32[] public roots;

    function addRoot(bytes32 root) external {
        require(!isRoot[root], "duplicate-root");
        isRoot[root] = true;
        roots.push(root);
    }

    function addLeaf(
        bytes32 root,
        address account,
        uint256 amount,
        bytes calldata proof
    ) external {
        require(isRoot[root], "no-root");

        bytes32 h = keccak256(abi.encode(account, amount));

        require(checkProof(proof, root, h), "invalid-proof");

        amounts[account] = amount;
    }
}
