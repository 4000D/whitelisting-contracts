// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

library libLeaf {
    struct Leaf {
        address account;
        uint256 amount;
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
