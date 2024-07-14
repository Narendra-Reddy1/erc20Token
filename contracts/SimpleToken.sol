// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleToken is ERC20 {
    constructor(
        string memory _tokenName,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_tokenName, _symbol) {
        _mint(msg.sender, _totalSupply);
    }

    function burn(address owner, uint256 tokens) public {
        _burn(owner, tokens);
    }
}
