const {
  KYCCountryOfResidenceCredential,
} = require("./vcHelpers/KYCCountryOfResidenceCredential");

// design your own customised authentication requirement here using Query Language
// https://0xpolygonid.github.io/tutorials/verifier/verification-library/zk-query-language/

const humanReadableAuthReason =
  "Must live in a country other than listed: China, North Korea, or Russia";

const credentialSubject = {
  countryCode: {
    $nin: [156, 408, 643],
  },
};

const proofRequest = KYCCountryOfResidenceCredential(credentialSubject);

module.exports = {
  humanReadableAuthReason,
  proofRequest,
};
