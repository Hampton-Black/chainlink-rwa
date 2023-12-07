import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { readContract } from "@wagmi/core";
import { NextPage } from "next";
import deployedContracts from "~~/contracts/deployedContracts";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

interface NFT {
  uri: string;
  owner: string;
}

const AssetPage: NextPage = () => {
  const router = useRouter();
  const tokenId = router.query.tokenId;

  const [nft, setNft] = useState<NFT | null>(null);
  const [image, setImage] = useState<string | null>(null);

  const { data: contract } = useDeployedContractInfo("RealWorldAsset");

  const deployedABI = deployedContracts["80001"].RealWorldAsset.abi;

  useEffect(() => {
    const fetchNFT = async () => {
      if (typeof tokenId !== "string") {
        // Handle the case where tokenId is not a string
        return;
      }

      // uri is defined in a contract RealWorldAsset inherits from
      const uri = await readContract({
        address: contract?.address ?? "",
        abi: deployedABI,
        functionName: "uri",
        args: [BigInt(tokenId)],
      });

      const owner = await readContract({
        address: contract?.address ?? "",
        abi: deployedABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });

      const nft = { uri, owner };
      setNft(nft);

      const metadata = await fetch(nft.uri);
      const metadataJSON = await metadata.json();
      const ipfsUrl = metadataJSON.image.replace("ipfs://", "https://ipfs.io/ipfs/");

      setImage(ipfsUrl);
    };

    if (tokenId && contract) {
      fetchNFT();
    }
  }, [tokenId, contract, deployedABI]);

  return (
    <div>
      {nft ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image && <img src={image} alt="NFT" width={300} height={300} className="rounded-lg" />}
          <p>Owner: {nft.owner}</p>
        </>
      ) : (
        <>
          <p>Loading...</p> <span className="loading loading-spinner loading-lg"></span>
        </>
      )}
    </div>
  );
};

export default AssetPage;
