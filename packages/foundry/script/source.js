/** Source code for the RWA NFT metadata API request
 * Will use Attom API to get property data and valuation data.
 */

// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const tokenId = args[0];
const location = args[1];

if (!secrets.apiKey) {
  throw Error(
    "ATTOM_API_KEY environment variable not set for Attom API.  Get a free key from https://api.developer.attomdata.com/"
  );
}

const [street, city, state, zip] = location
  .split(",")
  .map((part) => part.trim());

const address2 = city + " " + state + " " + zip;

// build HTTP request objects
const attomRequest = Functions.makeHttpRequest({
  url: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/valuation/homeequity`,
  method: "GET",
  headers: {
    accept: "application/json",
    apikey: `${secrets.apiKey}`,
  },
  params: {
    address1: `${street}`,
    address2: `${address2}`,
  },
});

// First, execute all the API requests are executed concurrently, then wait for the responses
const attomResponse = await attomRequest;

// Functions.encodeString helper function to encode the result from String to bytes
return Functions.encodeString(attomResponse.data.property[0].avm.amount.value);
