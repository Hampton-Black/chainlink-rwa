const fs = require("fs");
const path = require("path");
const {
  SecretsManager,
  simulateScript,
  buildRequestCBOR,
  ReturnType,
  decodeResult,
  Location,
  CodeLanguage,
} = require("@chainlink/functions-toolkit");
const automatedFunctionsConsumerAbi = require("../out/RealWorldAsset.sol/RealWorldAsset.json");
const ethers = require("ethers");
const { base64 } = require("ethers/lib/utils");
require("dotenv").config();

const consumerAddress = "0xa7Cf39C58d45830CA54411bB0FE3bFF53a27B66c"; // REPLACE this with your Functions consumer address
const subscriptionId = 858; // REPLACE this with your subscription ID

const updateRequestMumbai = async () => {
  // hardcoded for Polygon Mumbai
  const routerAddress = "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C";
  const donId = "fun-polygon-mumbai-1";
  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ];
  const explorerUrl = "https://mumbai.polygonscan.com";

  // Initialize functions settings
  const source = fs
    .readFileSync(path.resolve(__dirname, "source.js"))
    .toString();

  // Initialize ethers signer and provider to interact with the contracts onchain
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY; // fetch PRIVATE_KEY
  if (!privateKey)
    throw new Error(
      "private key not provided - check your environment variables"
    );

  const rpcUrl = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

  if (!rpcUrl)
    throw new Error(`rpcUrl not provided  - check your environment variables`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider); // create ethers signer for signing transactions

  // Initialize the Functions Consumer contract
  const automatedFunctionsConsumer = new ethers.Contract(
    consumerAddress,
    automatedFunctionsConsumerAbi.abi,
    signer
  );

  // Fetch metadata from the smart contract
  const metadata = await automatedFunctionsConsumer.getMetadata(1);
  const metadataSchema = {
    name: metadata.name,
    assetType: metadata.assetType,
    location: metadata.location,
    image: metadata.image,
    jsonSchema: metadata.jsonSchema,
  };

  console.log("metadataSchema: ", metadataSchema);

  const metadataString = JSON.stringify(metadataSchema);

  console.log("metadataString: ", metadataString);

  const args = ["1", metadataString]; // args to pass to the source script
  const secrets = { apiKey: process.env.PINATA_API_KEY };
  const slotIdNumber = 0; // slot ID where to upload the secrets
  const expirationTimeMinutes = 150; // expiration time in minutes of the secrets
  const gasLimit = 300_000;

  ///////// START SIMULATION ////////////

  console.log("Start simulation...");

  const response = await simulateScript({
    source: source,
    args: args,
    bytesArgs: [],
    secrets: secrets,
  });

  console.log("Simulation result", response);
  const errorString = response.errorString;
  if (errorString) {
    console.log(`❌ Error during simulation: `, errorString);
  } else {
    const returnType = ReturnType.string;
    const responseBytesHexstring = response.responseBytesHexstring;
    if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
      const decodedResponse = decodeResult(
        response.responseBytesHexstring,
        returnType
      );
      console.log(`✅ Decoded response to ${returnType}: `, decodedResponse);
    }
  }

  //////// MAKE REQUEST ////////

  console.log("\nMake request...");

  // First encrypt secrets and upload the encrypted secrets to the DON
  const secretsManager = new SecretsManager({
    signer: signer,
    functionsRouterAddress: routerAddress,
    donId: donId,
  });
  await secretsManager.initialize();

  // Encrypt secrets and upload to DON
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  console.log(
    `Upload encrypted secret to gateways ${gatewayUrls}. slotId ${slotIdNumber}. Expiration in minutes: ${expirationTimeMinutes}`
  );
  // Upload secrets
  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
    gatewayUrls: gatewayUrls,
    slotId: slotIdNumber,
    minutesUntilExpiration: expirationTimeMinutes,
  });

  if (!uploadResult.success)
    throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`);

  console.log(
    `\n✅ Secrets uploaded properly to gateways ${gatewayUrls}! Gateways response: `,
    uploadResult
  );

  const donHostedSecretsVersion = parseInt(uploadResult.version); // fetch the version of the encrypted secrets
  const donHostedEncryptedSecretsReference =
    secretsManager.buildDONHostedEncryptedSecretsReference({
      slotId: slotIdNumber,
      version: donHostedSecretsVersion,
    }); // encode encrypted secrets version

  // Encode request

  const functionsRequestBytesHexString = buildRequestCBOR({
    codeLocation: Location.Inline, // Location of the source code - Only Inline is supported at the moment
    codeLanguage: CodeLanguage.JavaScript, // Code language - Only JavaScript is supported at the moment
    secretsLocation: Location.DONHosted, // Location of the encrypted secrets - DONHosted in this example
    source: source, // soure code
    encryptedSecretsReference: donHostedEncryptedSecretsReference,
    args: args,
    bytesArgs: [], // bytesArgs - arguments will be added on-chain in RealWorldAsset.performUpkeep()
  });

  // Update request settings
  const transaction = await automatedFunctionsConsumer.sendRequestCBOR(
    functionsRequestBytesHexString,
    subscriptionId,
    gasLimit,
    ethers.utils.formatBytes32String(donId) // jobId is bytes32 representation of donId
  );

  // Log transaction details
  console.log(
    `\n✅ Automated Functions request settings updated! Transaction hash ${transaction.hash} - Check the explorer ${explorerUrl}/tx/${transaction.hash}`
  );
};

updateRequestMumbai().catch((e) => {
  console.error(e);
  process.exit(1);
});
