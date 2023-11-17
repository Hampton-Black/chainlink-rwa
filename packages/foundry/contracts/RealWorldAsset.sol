// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RealWorldAsset is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address deployer) ERC1155("https://example.com/token/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, deployer);
        _grantRole(MINTER_ROLE, deployer);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public {
        require(hasRole(MINTER_ROLE, msg.sender), "RealWorldAsset: must have minter role to mint");
        _mint(account, id, amount, data);
    }

    function burn(address account, uint256 id, uint256 amount) public {
        require(
            account == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "RealWorldAsset: must have admin role or be the account owner to burn"
        );
        _burn(account, id, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
