import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { readContract } from "@wagmi/core";
import { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

interface NFT {
  uri: string;
  owner: string;
  title: string;
  description: string;
  location: string;
  status: string;
  price: string;
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

      const status = await readContract({
        address: contract?.address ?? "",
        abi: deployedABI,
        functionName: "getAssetState",
        args: [BigInt(tokenId)],
      });

      const metadata = await fetch(uri);
      const metadataJSON = await metadata.json();
      const ipfsUrl = metadataJSON.image.replace(
        "ipfs://",
        "https://turquoise-elderly-panther-553.mypinata.cloud/ipfs/",
      );

      const nft = {
        uri,
        owner,
        title: metadataJSON.name,
        description: metadataJSON.description,
        location: metadataJSON.location,
        status,
        price: metadataJSON.price,
      };

      setImage(ipfsUrl);
      setNft(nft);
    };

    if (tokenId && contract) {
      fetchNFT();
    }
  }, [tokenId, contract, deployedABI]);

  return (
    <div className="flex flex-col md:flex-row justify-center items-start md:items-center md:space-x-6 p-16">
      <div className="flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image && <img src={image} alt="NFT" width={600} height={600} className="rounded-lg" />}
      </div>
      <div className="mt-6 md:mt-0 p-8">
        <h2 className="text-2xl font-bold">{nft?.title}</h2>
        <p className="mt-2 text-gray-600">{nft?.description}</p>
        <h3 className="mt-4 text-xl">Owner</h3>
        <Address address={nft?.owner} />
        <h3 className="mt-4 text-xl">Asset Location</h3>
        <p>{nft?.location}</p>
        <h3 className="mt-4 text-xl">Asset Status</h3>
        <p>{nft?.status}</p>
        <h3 className="mt-4 text-xl">Current Valuation</h3>
        <p>23,000,000</p>
        <h3 className="mt-4 text-xl">List Price</h3>
        <p>48,000,000</p>
        <button className="mt-4 px-6 py-2 btn btn-primary btn-wide">Buy Now</button>

        <h2 className="mt-8 text-2xl font-bold italic">Certifiers only</h2>
        <button className="mt-4 px-6 py-2 btn btn-secondary btn-wide">Add Warranty</button>
      </div>
    </div>
  );
};

export default AssetPage;
