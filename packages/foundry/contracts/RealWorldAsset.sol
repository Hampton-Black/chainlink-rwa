// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract RealWorldAsset is ERC1155, AccessControl, ERC1155Pausable, ERC1155Burnable, ERC1155Supply {
    bytes32 public constant METADATOR_ROLE = keccak256("METADATOR_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct Metadata {
        string name;
        string assetType;
        string location;
    }

    mapping(uint256 => Metadata) public metadata;

    constructor(address deployer) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, deployer);
        _grantRole(MINTER_ROLE, deployer);
        _grantRole(PAUSER_ROLE, deployer);
        _grantRole(METADATOR_ROLE, deployer);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    function setURI(string memory newuri) public onlyRole(METADATOR_ROLE) {
        _setURI(newuri);
    }

    function setMetadata(uint256 id, string memory name, string memory assetType, string memory location)
        public
        onlyRole(METADATOR_ROLE)
    {
        metadata[id] = Metadata(name, assetType, location);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // *********************************************************************************************
    // * The following functions are necessary for the Chainlink Decentralized Oracle Network (DON).
    // *********************************************************************************************

    // *********************************************************************************************
    // * The following functions are overrides required by Solidity.
    // *********************************************************************************************

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        super._update(from, to, ids, values);
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
