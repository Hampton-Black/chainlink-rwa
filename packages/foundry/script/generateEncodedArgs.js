const ethers = require("ethers");

// use ethers to test out abi.encoding of input parameters
const abi = new ethers.utils.AbiCoder();
const encoded = abi.encode(
  ["string", "string", "string"],
  ["test", "real estate", "Miami, FL"]
);

const encodedID = abi.encode(["uint256"], [1]);

console.log(encoded);
// console.log(encodedID);
