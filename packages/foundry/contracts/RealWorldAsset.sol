// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract RealWorldAsset is
    ERC1155,
    AccessControl,
    ERC1155Pausable,
    ERC1155Burnable,
    ERC1155Supply,
    AutomationCompatible
{
    using Strings for uint256;

    bytes32 public constant METADATOR_ROLE = keccak256("METADATOR_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct Metadata {
        string name;
        string assetType;
        string location;
    }

    mapping(uint256 => Metadata) public metadata;

    bool private upkeepRequested;
    uint256 public immutable interval;
    uint256 public lastTimeStamp;

    constructor(address deployer, uint256 updateInterval) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, deployer);
        _grantRole(MINTER_ROLE, deployer);
        _grantRole(PAUSER_ROLE, deployer);
        _grantRole(METADATOR_ROLE, deployer);

        // note: testing only
        _grantRole(DEFAULT_ADMIN_ROLE, 0x6f440F479B9Acd8Da0471D852BCfAeA1B09987E6);

        // set the interval for the upkeep
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
        // initial metadata creation
        (string memory name, string memory assetType, string memory location) =
            abi.decode(data, (string, string, string));

        metadata[id] = Metadata(name, assetType, location);

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
        upkeepRequested = true;
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

    /* @dev this method is called by the Chainlink Automation Nodes to check if `performUpkeep` must be done. 
     * @dev `checkData` is an encoded binary data and which contains the token ID
     * @dev return `upkeepNeeded` if metadata has updated and `performData` which contains the new json schema to be uploaded to IPFS. 
     *      This will be used in `performUpkeep`
     */
    function checkUpkeep(bytes calldata checkData)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (upkeepRequested || (block.timestamp - lastTimeStamp) < interval) {
            upkeepNeeded = true;
        }

        uint256 tokenId = abi.decode(checkData, (uint256));

        // generate json schema of metadata "off-chain" via Chainlink oracles doing automation upkeep
        bytes memory dataURI = abi.encodePacked(
            "{",
            '"name": ',
            '"',
            metadata[tokenId].name,
            '",',
            '"description": "Real World Asset digital twin NFT",',
            '"asset type": ',
            '"',
            metadata[tokenId].assetType,
            '",',
            '"image": "',
            // generateSVG(tokenId),
            '"',
            "}"
        );

        string memory jsonSchema = string(abi.encodePacked("data:application/json;base64,", Base64.encode(dataURI)));

        performData = abi.encode(jsonSchema);

        return (upkeepNeeded, performData);
    }

    /* @dev this method is called by the Automation Nodes. It uploads the new json schema to IPFS. 
     * @dev `performData` is an encoded binary data which contains the json schema.
     * note: can also use this with Chainlink Functions to retrieve dynamic data from external APIs.
     */
    function performUpkeep(bytes calldata performData) external override {
        if (upkeepRequested || (block.timestamp - lastTimeStamp) < interval) {
            upkeepRequested = false;
            lastTimeStamp = block.timestamp;

            string memory jsonSchema = abi.decode(performData, (string));
            // use Chainlink Function to store jsonSchema in IPFS and return hash to store in metadata
        }
    }

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
