import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
// import { useRouter } from "next/router";
import mockNfts from "../public/mockNfts.json";
import { NextPage } from "next";

interface NFT {
  tokenId: string;
  name: string;
  assetType: string;
  assetStatus: string;
  assetLocation: string;
  listPrice: string;
  description: string;
  image: string;
}

const SellerDashboard: NextPage = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nfts, setNfts] = useState<NFT[]>(mockNfts);

  // @TODO: to do this properly, will need to setup a Graph Subgraph to query all NFTs in contract to display
  // useEffect(() => {
  // Fetch the NFTs created by the current user
  // This is just a placeholder, replace it with your actual data fetching code
  // fetch("/api/nfts")
  //   .then(response => response.json())
  //   .then(data => setNfts(data));
  // }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your NFTs</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {nfts.map(nft => (
          <div key={nft.name} className="card lg:card-side glass shadow-xl">
            <figure className="p-4">
              <Image src={nft.image} alt={`${nft.name} image`} width={300} height={300} className="rounded-lg" />
            </figure>
            <div className="card-body">
              <h2 className="card-title">{nft.name}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li className="text-sm ">{nft.assetLocation}</li>
                <li className="text-sm ">{nft.description}</li>
                <li className="text-sm ">{nft.listPrice}</li>
              </ul>
              <div className="card-actions justify-end">
                <Link href={`/assets/${nft.tokenId}`}>
                  <button className="btn btn-primary">Manage</button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;
