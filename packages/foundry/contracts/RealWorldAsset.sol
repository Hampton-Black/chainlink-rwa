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
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_X/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

contract RealWorldAsset is
    ERC1155,
    AccessControl,
    ERC1155Pausable,
    ERC1155Burnable,
    ERC1155Supply,
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
        string sampleThumbnail; // IPFS hash
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
        uint256 assetOwnershipShare; // 100% = 10000
        string assetThumbnail; // IPFS hash
        string fullURI; // IPFS hash
    }

    struct LegalContract {
        bytes signature; // EIP-712 signature of the asset owner
        string uri; // IPFS hash
    }

    // Enum of different states of the asset
    enum AssetState {
        Uncertified,
        Certified,
        Vaulted,
        InTransit,
        InUse,
        Destroyed
    }

    // Map different types of metadata to token ID
    mapping(uint256 => Metadata) public metadata;
    mapping(uint256 => LegalContract) public legalContracts;
    mapping(uint256 => Certifier[]) public certifiers;
    mapping(uint256 => Warranty[]) public warranties;

    // Map token ID to current state
    mapping(uint256 => AssetState) public assetStates;

    // Map token ID to dynamic valuation
    mapping(uint256 => Checkpoints.Trace224) private _valuations;

    // @dev variables needed for Chainlink ops
    bytes public s_request;
    uint64 public s_subscriptionId;
    uint32 public s_gasLimit;
    bytes32 public s_donID;
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    // *********************************************************************************************
    // * Custom Errors and Events
    // *********************************************************************************************

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

        // note: testing only
        _grantRole(DEFAULT_ADMIN_ROLE, 0x6f440F479B9Acd8Da0471D852BCfAeA1B09987E6);
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- minting
    // *********************************************************************************************

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
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
        uint256 assetOwnershipShare = (balanceOf(account, id) + amount) * 10000 / (totalSupply(id) + amount);

        // Initial metadata creation
        metadata[id] = Metadata(name, assetType, location, assetOwnershipShare, assetThumbnail, fullURI);

        // Initial legal contract creation
        // TODO: add EIP-712 signature verification and revert if invalid?
        legalContracts[id] = LegalContract(signature, legalURI);

        _mint(account, id, amount, data);
    }

    // note: Is this needed for this use case?
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- Metadata
    // *********************************************************************************************

    function getMetadata(uint256 id) public view returns (Metadata memory) {
        return metadata[id];
    }

    function updateMetadata(
        uint256 id,
        string memory name,
        string memory assetType,
        string memory location,
        string memory fullURI,
        string memory assetThumbnail
    ) public onlyRole(METADATOR_ROLE) {
        if (bytes(name).length != 0) {
            metadata[id].name = name;
        }
        if (bytes(assetType).length != 0) {
            metadata[id].assetType = assetType;
        }
        if (bytes(location).length != 0) {
            metadata[id].location = location;
        }
        if (bytes(fullURI).length != 0) {
            metadata[id].fullURI = fullURI;
        }
        if (bytes(assetThumbnail).length != 0) {
            metadata[id].assetThumbnail = assetThumbnail;
        }
    }

    function getLegalContract(uint256 id) public view returns (LegalContract memory) {
        return legalContracts[id];
    }

    // *********************************************************************************************
    // * Public and External Functions
    // * -- Certifications
    // *********************************************************************************************

    function getCertifiers(uint256 id) public view returns (Certifier[] memory) {
        return certifiers[id];
    }

    function certifyAsset(uint256 id, address certifier, uint16 percentage, string memory sampleThumbnail)
        public
        onlyRole(CERTIFIER_ROLE)
    {
        certifiers[id].push(Certifier(certifier, percentage, sampleThumbnail));
    }

    // function to register a new Certifier
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
        return warranties[id];
    }

    function addWarranty(uint256 id, uint32 expiration, uint16 percentage, string memory fullURI)
        public
        onlyRole(METADATOR_ROLE) // which role should this be?
    {
        warranties[id].push(Warranty(uint32(block.timestamp), expiration, percentage, fullURI));
    }

    // function to renew a warranty
    function renewWarranty(uint256 id, uint32 expiration, string memory fullURI)
        public
        onlyRole(METADATOR_ROLE) // which role should this be?
    {
        require(warranties[id].length > 0, "No warranty exists for this asset");

        // retrieve warranty with same fullURI and update expiration
        for (uint256 i = 0; i < warranties[id].length; i++) {
            if (keccak256(bytes(warranties[id][i].fullURI)) == keccak256(bytes(fullURI))) {
                require(warranties[id][i].expiration > block.timestamp, "Warranty has already expired");

                warranties[id][i].expiration = expiration;
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

    // note: which role should this be? Will be called by Chainlink Functions
    function updateValuation(uint256 id, uint224 value) public onlyRole(METADATOR_ROLE) {
        _valuations[id].push(uint32(block.timestamp), value);
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

    /**
     * @notice Send a pre-encoded CBOR request
     * @param request CBOR-encoded request data
     * @param subscriptionId Billing ID
     * @param gasLimit The maximum amount of gas the request can consume
     * @param donID ID of the job to be invoked
     * @return requestId The ID of the sent request
     */
    function sendRequestCBOR(bytes memory request, uint64 subscriptionId, uint32 gasLimit, bytes32 donID)
        external
        onlyOwner
        returns (bytes32 requestId)
    {
        s_lastRequestId = _sendRequest(request, subscriptionId, gasLimit, donID);
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
