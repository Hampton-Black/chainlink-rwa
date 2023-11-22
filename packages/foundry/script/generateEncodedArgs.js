const ethers = require("ethers");

// use ethers to test out abi.encoding of input parameters
const abi = new ethers.utils.AbiCoder();
const encoded = abi.encode(
  ["string", "string", "string", "string", "string", "bytes", "string"],
  [
    "RWA test",
    "real estate",
    "Miami, FL",
    "qmbeiffullURIHash",
    "qmbeifPhotoHash",
    "0x02382efe2282ab",
    "qmbeifLegalDocHash",
  ]
);

const encodedID = abi.encode(["uint256"], [1]);

console.log(encoded);
// console.log(encodedID);

let oneYearFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
console.log(oneYearFromNow);
