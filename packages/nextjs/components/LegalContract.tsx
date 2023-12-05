import React from "react";
import { signTypedData } from "@wagmi/core";
import { pinJSONToIPFS } from "~~/services/pinataService";

interface LegalContractProps {
  DID: string;
  walletAddress: string;
  handleLegalContractData: (signature: string, contractURI: string) => void;
}

const LegalContract: React.FC<LegalContractProps> = ({
  DID,
  walletAddress,
  handleLegalContractData,
}: LegalContractProps) => {
  const contractTerms = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor aliquam lacus, at viverra ante dictum
    quis. Sed purus sem, scelerisque ac rhoncus eget, porttitor nec odio. Lorem ipsum dolor sit amet, consectetur
    adipiscing elit. Suspendisse potenti.
    Phasellus et lacinia lorem, id luctus dui. Nulla at semper nisl, at elementum elit. Nunc ut diam quis
    augue semper venenatis. Fusce sed nibh vitae velit sagittis egestas eu ut tortor. Nam risus erat,
    tristique at auctor nec, aliquet quis neque.
    Etiam a neque ut augue mattis gravida vel vel purus. Maecenas id varius velit, at luctus diam. Sed in
    sem convallis, pulvinar neque a, aliquet ante. Vestibulum ante ipsum primis in faucibus orci luctus et
    ultrices posuere cubilia curae; Sed libero velit, feugiat et lobortis at, accumsan sed arcu.`;

  const domain = {
    name: "Legal Contract for RWA NFTs with Mattereum",
    version: "1",
    chainId: 80001, // Replace with the actual chain ID
    verifyingContract: "0x5781d7f8fc387aD82917b6CF12b0e7A35b91f0FA", // Replace with your contract address
  } as const;

  const types = {
    LegalContract: [
      { name: "title", type: "string" },
      { name: "parties", type: "Party[]" },
      { name: "terms", type: "string" },
      { name: "effectiveDate", type: "uint256" },
    ],
    Party: [
      { name: "DID", type: "string" },
      { name: "address", type: "address" },
    ],
  } as const;

  const message = {
    title: "Issuance Agreement for Real World Asset Semi-fungible Tokens with Mattereum",
    parties: [
      {
        DID: DID,
        address: walletAddress,
      },
    ],
    terms: contractTerms,
    effectiveDate: BigInt(Math.floor(Date.now() / 1000)), // Date stamp converted to Unix timestamp in seconds
  } as const;

  const handleClick = async () => {
    try {
      const signature = await signTypedData({
        domain,
        message,
        primaryType: "LegalContract",
        types,
      });

      console.log(signature);

      const data = JSON.stringify({
        pinataContent: {
          ...message,
          effectiveDate: message.effectiveDate.toString(),
        },
        pinataMetadata: {
          name: "RWA NFT Legal Contract for " + DID,
          keyvalues: {
            date: new Date().toISOString().split("T")[0],
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      });

      try {
        const response = await pinJSONToIPFS(data);
        console.log(response);

        handleLegalContractData(signature, response);
      } catch (err1) {
        console.error("Error pinning to IPFS: ", err1);
      }
    } catch (err2) {
      console.error("Error signing data: ", err2);
    }
  };

  return (
    <>
      <div className="bg-white p-8 my-4 text-justify border border-gray-300 shadow-lg h-96 overflow-auto dark:text-black">
        <h3 className="font-bold text-2xl mb-4">Contract Title</h3>

        <p className="mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor aliquam lacus, at viverra ante dictum
          quis. Sed purus sem, scelerisque ac rhoncus eget, porttitor nec odio. Lorem ipsum dolor sit amet, consectetur
          adipiscing elit. Suspendisse potenti.
        </p>
        {Array(3)
          .fill(null)
          .map((_, index) => (
            <React.Fragment key={index}>
              <p className="mb-4">
                Phasellus et lacinia lorem, id luctus dui. Nulla at semper nisl, at elementum elit. Nunc ut diam quis
                augue semper venenatis. Fusce sed nibh vitae velit sagittis egestas eu ut tortor. Nam risus erat,
                tristique at auctor nec, aliquet quis neque.
              </p>
              <p className="mb-4">
                Etiam a neque ut augue mattis gravida vel vel purus. Maecenas id varius velit, at luctus diam. Sed in
                sem convallis, pulvinar neque a, aliquet ante. Vestibulum ante ipsum primis in faucibus orci luctus et
                ultrices posuere cubilia curae; Sed libero velit, feugiat et lobortis at, accumsan sed arcu.
              </p>
            </React.Fragment>
          ))}
      </div>

      <div className="flex justify-center py-4">
        <button type="button" onClick={handleClick} className="btn btn-wide dark:btn-accent btn-primary ">
          Sign Contract
        </button>
      </div>
    </>
  );
};

export default LegalContract;
