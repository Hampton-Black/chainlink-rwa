// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import {AccessControl, IAccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155URIStorage} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_X/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

contract RealWorldAsset is
    ERC1155,
    AccessControl,
    ERC1155Pausable,
    ERC1155Burnable,
    ERC1155Supply,
    ERC1155URIStorage,
    FunctionsClient,
    ConfirmedOwner
{
    // *********************************************************************************************
    // * Libraries and Data Structures
    // *********************************************************************************************

    using Strings for uint256;
    using Checkpoints for Checkpoints.Trace224;

    bytes32 public constant METADATOR_ROLE = keccak256("METADATOR_ROLE");
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct Certifier {
        address certifier; // registered wallet address of certifier
        uint16 percentage; // 100% = 10000
    }

    struct Warranty {
        uint32 timestamp;
        uint32 expiration;
        uint16 percentage;
        string fullURI; // IPFS hash
    }

    struct Metadata {
        string name;
        string assetType;
        string location;
        string assetThumbnail; // IPFS hash
        string fullURI; // IPFS hash
    }

    struct LegalContract {
        bytes signature; // EIP-712 signature of the asset owner
        string uri; // IPFS hash
    }

    // Enum of different states of the asset
    enum AssetState {
        DoesNotExist,
        Uncertified,
        Certified,
        Vaulted,
        InUse,
        InEscrow,
        InTransit,
        Received,
        Destroyed,
        Rejected,
        Disputed,
        InArbitration,
        ArbitrationComplete
    } // possibly add modifiers to restrict certain functions to certain states

    // Map different types of metadata to token ID
    mapping(uint256 => Metadata) private _metadata;
    mapping(uint256 => LegalContract) private _legalContracts;
    mapping(uint256 => Certifier[]) private _certifiers;
    mapping(uint256 => Warranty[]) private _warranties;

    // Map token ID to asset ownership share
    mapping(uint256 => mapping(address => uint16)) private _assetOwnershipShare; // 100% = 10000

    // Map token ID to current state
    mapping(uint256 => AssetState) private _assetStates;

    // Define a mapping to store the string representations of the enum values
    mapping(AssetState => string) private _assetStateToString;

    // Map token ID to dynamic valuation
    mapping(uint256 => Checkpoints.Trace224) private _valuations;

    mapping(uint256 => uint32) private _numberOfCertifiers;
    mapping(uint256 => uint32) private _numberOfWarranties;

    // @dev variables needed for Chainlink ops
    address public upkeepContract;
    bytes public s_request;
    uint64 public s_subscriptionId;
    uint32 public s_gasLimit;
    bytes32 public s_donID;
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    uint256 private _tokenIdCounter;

    // *********************************************************************************************
    // * Custom Errors and Events
    // *********************************************************************************************

    error NotAllowedCaller(address caller, address owner, address automationRegistry);

    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    // TODO: add events for all functions

    // *********************************************************************************************
    // * Constructor
    // *********************************************************************************************

    constructor(address deployer, address router) ERC1155("") FunctionsClient(router) ConfirmedOwner(deployer) {
        _grantRole(DEFAULT_ADMIN_ROLE, deployer);
        _grantRole(MINTER_ROLE, deployer);
        _grantRole(PAUSER_ROLE, deployer);
        _grantRole(METADATOR_ROLE, deployer);

        // Initialize the mapping with the string representations of the enum values
        _assetStateToString[AssetState.DoesNotExist] = "Does Not Exist";
        _assetStateToString[AssetState.Uncertified] = "Uncertified";
        _assetStateToString[AssetState.Certified] = "Certified";
        _assetStateToString[AssetState.Vaulted] = "Vaulted";
        _assetStateToString[AssetState.InUse] = "In Use";
        _assetStateToString[AssetState.InEscrow] = "In Escrow";
        _assetStateToString[AssetState.InTransit] = "In Transit";
        _assetStateToString[AssetState.Received] = "Received";
        _assetStateToString[AssetState.Destroyed] = "Destroyed";
        _assetStateToString[AssetState.Rejected] = "Rejected";
        _assetStateToString[AssetState.Disputed] = "Disputed";
        _assetStateToString[AssetState.InArbitration] = "In Arbitration";
        _assetStateToString[AssetState.ArbitrationComplete] = "Arbitration Complete";

        _setBaseURI("https://ipfs.io/ipfs/");

        // note: testing only
        _grantRole(DEFAULT_ADMIN_ROLE, 0x6f440F479B9Acd8Da0471D852BCfAeA1B09987E6);
    }

    // *********************************************************************************************
    // * Modifiers
    // *********************************************************************************************

    /**
     * @notice Reverts if called by anyone other than the contract owner or automation registry.
     */
    modifier onlyAllowed() {
        if (msg.sender != owner() && msg.sender != upkeepContract) {
            revert NotAllowedCaller(msg.sender, owner(), upkeepContract);
        }
        _;
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- minting
    // *********************************************************************************************

    function fractionalizeAsset(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        // Check token exists first
        require(exists(id), "ERC1155: Can only fractionalize existing token.");

        // note: should metadata and legal signatures always be updated?
        // decode data to get metadata values
        (
            string memory name,
            string memory assetType,
            string memory location,
            string memory fullURI,
            string memory assetThumbnail,
            bytes memory signature,
            string memory legalURI
        ) = abi.decode(data, (string, string, string, string, string, bytes, string));

        // calculate asset ownership share based on current balance
        uint256 newAssetOwnershipShare = (balanceOf(account, id) + amount) * 10000 / (totalSupply(id) + amount);
        _assetOwnershipShare[id][account] = uint16(newAssetOwnershipShare);

        // Initial metadata creation
        _metadata[id] = Metadata(name, assetType, location, assetThumbnail, fullURI);

        // Initial legal contract creation
        // TODO: add EIP-712 signature verification and revert if invalid?
        _legalContracts[id] = LegalContract(signature, legalURI);

        // Initial asset state
        _assetStates[id] = AssetState.Uncertified;

        _setURI(id, fullURI);

        _mint(account, id, amount, data);
    }

    function mint(address account, uint256 amount, bytes memory data) public {
        // auto-increment token ID counter
        _tokenIdCounter += 1;
        uint256 id = _tokenIdCounter;

        // decode data to get metadata values
        (
            string memory name,
            string memory assetType,
            string memory location,
            string memory fullURI,
            string memory assetThumbnail,
            bytes memory signature,
            string memory legalURI
        ) = abi.decode(data, (string, string, string, string, string, bytes, string));

        // calculate asset ownership share based on current balance
        uint256 newAssetOwnershipShare = (balanceOf(account, id) + amount) * 10000 / (totalSupply(id) + amount);
        _assetOwnershipShare[id][account] = uint16(newAssetOwnershipShare);

        // Initial metadata creation
        _metadata[id] = Metadata(name, assetType, location, assetThumbnail, fullURI);

        // Initial legal contract creation
        // TODO: add EIP-712 signature verification and revert if invalid?
        _legalContracts[id] = LegalContract(signature, legalURI);

        // Initial asset state
        _assetStates[id] = AssetState.Uncertified;

        _setURI(id, fullURI);

        _mint(account, id, amount, data);
    }

    // note: Is this needed for this use case?
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    function registerMinter(address minter) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // TODO: add logic to verify minter is a valid address
        // TODO: add logic to verify minter is not already registered
        // TODO: EIP 712 signature verification?

        _grantRole(MINTER_ROLE, minter);
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- Metadata
    // *********************************************************************************************

    function getMetadata(uint256 id) public view returns (Metadata memory) {
        return _metadata[id];
    }

    function getOwnershipShare(uint256 id, address account) public view returns (uint16) {
        return _assetOwnershipShare[id][account];
    }

    function getAssetState(uint256 id) public view returns (string memory) {
        return _assetStateToString[_assetStates[id]];
    }

    function getLegalContract(uint256 id) public view returns (LegalContract memory) {
        return _legalContracts[id];
    }

    function updateMetadata(
        uint256 id,
        string memory name,
        string memory assetType,
        string memory location,
        string memory fullURI,
        string memory assetThumbnail
    ) public onlyRole(METADATOR_ROLE) {
        _metadata[id].name = name;
        _metadata[id].assetType = assetType;
        _metadata[id].location = location;
        _metadata[id].fullURI = fullURI;
        _metadata[id].assetThumbnail = assetThumbnail;
    }

    // @dev function to update the URI of the entire contract/all tokens.
    // @dev this should only be used to update the base URI for SVG template for tokens.
    function setURI(string memory newURI) public onlyRole(METADATOR_ROLE) {
        _setURI(newURI);
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- Certifications
    // *********************************************************************************************

    function getCertifiers(uint256 id) public view returns (Certifier[] memory) {
        return _certifiers[id];
    }

    function certifyAsset(uint256 id, address certifier, uint16 percentage) public onlyRole(CERTIFIER_ROLE) {
        _certifiers[id].push(Certifier(certifier, percentage));
        _numberOfCertifiers[id] += 1;
        _assetStates[id] = AssetState.Certified;
    }

    function registerCertifier(address certifier) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // TODO: add logic to verify certifier is a valid address
        // TODO: add logic to verify certifier is not already registered
        // TODO: EIP 712 signature verification?

        _grantRole(CERTIFIER_ROLE, certifier);
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- Warranties
    // *********************************************************************************************

    function getWarranties(uint256 id) public view returns (Warranty[] memory) {
        return _warranties[id];
    }

    function addWarranty(uint256 id, uint32 expiration, uint16 percentage, string memory fullURI)
        public
        onlyRole(CERTIFIER_ROLE)
    {
        _warranties[id].push(Warranty(uint32(block.timestamp), expiration, percentage, fullURI));
        _numberOfWarranties[id] += 1;
    }

    // function to renew a warranty
    function renewWarranty(uint256 id, uint32 expiration, string memory fullURI) public onlyRole(CERTIFIER_ROLE) {
        require(_warranties[id].length > 0, "No warranty exists for this asset");

        // retrieve warranty with same fullURI and update expiration
        for (uint256 i = 0; i < _warranties[id].length; i++) {
            if (keccak256(bytes(_warranties[id][i].fullURI)) == keccak256(bytes(fullURI))) {
                require(_warranties[id][i].expiration > block.timestamp, "Warranty has already expired");

                _warranties[id][i].expiration = expiration;
            }
        }
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- Valulations
    // *********************************************************************************************

    function getLatestValuation(uint256 id) public view returns (uint224) {
        return _valuations[id].latest();
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- Transfers
    // *********************************************************************************************

    // TODO: add logic to restrict transfers based on asset state

    // *********************************************************************************************
    // * The following functions are necessary for the Chainlink Decentralized Oracle Network (DON).
    // *********************************************************************************************

    function setAutomationCronContract(address _upkeepContract) external onlyOwner {
        upkeepContract = _upkeepContract;
    }

    /**
     * @notice Send a pre-encoded CBOR request
     * @return requestId The ID of the sent request
     */
    function sendRequestCBOR() external onlyAllowed returns (bytes32 requestId) {
        s_lastRequestId = _sendRequest(s_request, s_subscriptionId, s_gasLimit, s_donID);
        return s_lastRequestId;
    }

    /**
     * @notice Update the request settings
     * @dev Only callable by the owner of the contract
     * @param _request The new encoded CBOR request to be set. The request is encoded off-chain
     * @param _subscriptionId The new subscription ID to be set
     * @param _gasLimit The new gas limit to be set
     * @param _donID The new job ID to be set
     */
    function updateRequest(bytes memory _request, uint64 _subscriptionId, uint32 _gasLimit, bytes32 _donID)
        external
        onlyOwner
    {
        // update request settings from off-chain
        s_request = _request;
        s_subscriptionId = _subscriptionId;
        s_gasLimit = _gasLimit;
        s_donID = _donID;
    }

    // external function for Chainlink Oracles to call
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external {
        _fulfillRequest(requestId, response, err);
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function _fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;
        emit Response(requestId, s_lastResponse, s_lastError);

        // note: hardcode for now/testing only
        uint256 id = 1;
        _valuations[id].push(uint32(block.timestamp), abi.decode(response, (uint224)));
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

    function uri(uint256 tokenId) public view virtual override(ERC1155URIStorage, ERC1155) returns (string memory) {
        return super.uri(tokenId);
    }
}
