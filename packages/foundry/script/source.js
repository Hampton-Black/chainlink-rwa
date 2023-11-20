// To test Chainlink Functions first, this will only pass metadata from smart contract to Pinata to pin to IPFS
// note: Will need a Pinata API key and secret to run this script

// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const tokenId = args[0];
const jsonSchema = args[1];

if (!secrets.apiKey) {
  throw Error(
    "PINATA_API_KEY environment variable not set for Pinata API.  Get a free key from https://pinata.cloud/"
  );
}

// Decoding args
const decodedTokenId = Functions.decodeResult(tokenId, uint256);
const decodedJsonSchema = Functions.decodeResult(jsonSchema, string);

// convert stringify JSON to JSON object
const decodedJsonObj = JSON.parse(decodedJsonSchema);

console.log("decodedJsonObj: ", decodedJsonObj);

// build HTTP request objects
const pinataRequest = Functions.makeHttpRequest({
  url: `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secrets.apiKey}`,
  },
  data: {
    body: {
      pinataContent: decodedJsonObj,
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: `RWA NFT metadata for ${decodedTokenId}`,
      },
    },
  },
});

// First, execute all the API requests are executed concurrently, then wait for the responses
const pinataResponse = await pinataRequest;

console.log("pinataResponse: ", pinataResponse);

// Functions.encodeString helper function to encode the result from String to bytes
return Functions.encodeString(pinataResponse.data.IpfsHash);
