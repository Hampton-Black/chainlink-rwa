import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { NextPage } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { useAccount } from "wagmi";
import { ApiDataDisplay } from "~~/components/ApiDataDisplay";
import BaseThumbnail from "~~/components/BaseThumbnail";
import { FormButtons } from "~~/components/FormButtons";
import LegalContract from "~~/components/LegalContract";
import { ManualFormInputs } from "~~/components/ManualFormInputs";
import { EtherInput } from "~~/components/scaffold-eth";
import { ThemeContext } from "~~/contexts/ThemeContext";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { pinFileToIPFS, pinJSONToIPFS } from "~~/services/pinataService";

interface FormState {
  title: string;
  category: string;
  location: string;
  description: string;
  image: string;
  price: string;
  expiryDate: Date;
  DID?: string;
}

interface LegalContractData {
  signature: string;
  contractURI: string;
}

const MattereumPassport: NextPage = () => {
  const { isDarkTheme } = useContext(ThemeContext);

  const [formData, setFormData] = useState<FormState>({
    title: "",
    category: "",
    location: "",
    description: "",
    image: "",
    price: "",
    expiryDate: new Date(),
    DID: "",
  });
  const [useApi, setUseApi] = useState<boolean | undefined>(undefined);
  const [apiData, setApiData] = useState(null);
  const [manualFields, setManualFields] = useState([{ key: "", value: "" }]);
  const [fullNFTImageURI, setFullNFTImageURI] = useState("");
  const [fullMetadataURI, setFullMetadataURI] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalPage, setCurrentModalPage] = useState(1);
  const [legalContractData, setLegalContractData] = useState<LegalContractData | null>(null);

  const assetCategories = [
    "Real Estate",
    "Luxury Goods",
    "Art & Collectibles",
    "Precious Metals",
    "Fine Wine & Spirits",
    "IP & Patents",
    "Vehicles",
    "Other",
  ];

  const accountState = useAccount();

  // write to mint function
  const { writeAsync: writeAsyncMint } = useScaffoldContractWrite({
    contractName: "RealWorldAsset",
    functionName: "mint",
    args: [undefined, undefined, undefined],
    // For payable functions
    value: undefined,
    // The number of block confirmations to wait for before considering transaction to be confirmed (default : 1).
    blockConfirmations: 1,
    // The callback function to execute when the transaction is confirmed.
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const nextPage = () => {
    setCurrentModalPage(currentModalPage + 1);
  };

  const previousPage = () => {
    setCurrentModalPage(currentModalPage - 1);
  };

  const handleLegalContractData = (signature: string, contractURI: string) => {
    setLegalContractData({ signature, contractURI });
  };

  // A generic input change handler to update the form state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePriceChange = (newValue: string) => {
    setFormData({
      ...formData,
      price: newValue,
    });
  };

  const handleFieldChange = (index: number, type: "key" | "value", e: React.ChangeEvent<HTMLInputElement>) => {
    const newFields = [...manualFields];
    newFields[index][type] = e.target.value;
    setManualFields(newFields);
  };

  const handleAddField = () => {
    setManualFields([...manualFields, { key: "", value: "" }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...manualFields];
    newFields.splice(index, 1);
    setManualFields(newFields);
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Serialize the SVG to a string
    const svgString = renderToStaticMarkup(
      <BaseThumbnail
        img={formData.image}
        assetCategory={formData.category}
        numberOfCertifiers={0}
        numberOfWarranties={0}
      />,
    );

    // Convert the string to a Buffer
    const svgBuffer = Buffer.from(svgString);

    // Create a Blob from the PNG Buffer
    const svgBlob = new Blob([svgBuffer], { type: "image/svg+xml" });

    // Create a File object from the Blob
    const svgFile = new File([svgBlob], "nftThumbnail.svg");

    // Create a FormData object
    const pinataFormData = new FormData();

    // Append the File object to the FormData object
    pinataFormData.append("file", svgFile);

    const metadata = JSON.stringify({
      name: "Full RWA NFT Thumbnail for: " + formData.title + ", " + formData.category,
    });
    pinataFormData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append("pinataOptions", options);

    try {
      // open modal
      setIsModalOpen(true);

      const nftImageURI = await pinFileToIPFS(pinataFormData);
      console.log(nftImageURI);
      setFullNFTImageURI(nftImageURI);
    } catch (error) {
      console.error("Error pinning to IPFS: ", error);
    }
  };

  const handleIpfsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // format data for submission to Pinata
    const fullMetadata = {
      name: formData.title,
      description: formData.description,
      assetType: formData.category,
      image: `ipfs://${fullNFTImageURI}`,
      location: formData.location,
      legalContractData,
      attributes: apiData ? apiData : manualFields,
    };

    const data = JSON.stringify({
      pinataContent: {
        ...fullMetadata,
      },
      pinataMetadata: {
        name: "Full Metadata for RWA NFT " + formData.title + " " + formData.category,
        keyvalues: {
          date: new Date().toISOString().split("T")[0],
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    });

    try {
      const metadataURI = await pinJSONToIPFS(data);
      console.log(metadataURI);
      setFullMetadataURI(metadataURI);
    } catch (error) {
      console.error("Error pinning to IPFS: ", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const uploadedFile = event.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result as string,
        });
      };

      reader.readAsDataURL(uploadedFile);
    }
  };

  const mintNFT = async () => {
    // ---------  call the contract to mint the NFT
    // encode all collected data into a single bytes object for the smart contract
    const abiEncoder = new ethers.AbiCoder();

    const signatureBytes = ethers.getBytes(legalContractData?.signature ?? "0x00");

    console.log("full URI: ", fullMetadataURI);
    console.log("full NFT URI: ", fullNFTImageURI);

    const types = ["string", "string", "string", "string", "string", "bytes", "string"];
    const values = [
      formData.title,
      formData.category,
      formData.location,
      fullMetadataURI,
      fullNFTImageURI,
      signatureBytes,
      legalContractData?.contractURI ?? "",
    ];

    const abiEncodedData = abiEncoder.encode(types, values);
    const abiEncodedDataWithoutPrefix = abiEncodedData.substring(2);

    // call the contract
    await writeAsyncMint({
      args: [accountState.address, BigInt(1), `0x${abiEncodedDataWithoutPrefix}`],
    });
  };

  // Fetch data from the API when useApi changes
  useEffect(() => {
    if (useApi) {
      // Split the full address into parts around comma (i.e. "4525 Dean Martin Dr, Las Vegas, NV 12434")
      const [street, rest] = formData.location.split(",").map(part => part.trim());
      // Split the rest of the address into parts around the last space (i.e. "Las Vegas, NV 12434"), discarding the last part (i.e. "12434")
      const [cityState] = rest.split(/\s(?=\d+$)/);

      const address1 = street;
      const address2 = cityState;

      axios
        .get("https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile", {
          headers: {
            accept: "application/json",
            apikey: process.env.NEXT_PUBLIC_ATTOM_API_KEY,
            "accept-language": "en",
            "Content-Type": "application/json",
          },
          params: {
            address1: address1,
            address2: address2,
          },
        })
        .then(response => setApiData(response.data))
        .catch(error => console.error("Error:", error));
    }
  }, [useApi, formData.location]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container mx-auto flex flex-col md:flex-row">
        <main className="w-full md:w-1/4 glass p-8 shadow-md">
          <h1 className="text-2xl font-bold mb-8 text-center">Create New Passport</h1>
          {/* Form inputs and buttons */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label htmlFor="title" className="label">
                <span className="label-text text-xl">Title</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., Mattereum"
                className="input input-bordered bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="category" className="label">
                <span className="label-text text-xl">Category</span>
              </label>
              <select
                id="category"
                name="category"
                className="select select-bordered bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Select a category</option>
                {assetCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label htmlFor="location" className="label">
                <span className="label-text text-xl">Location of Asset</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="123 Main St, New York, NY 10001"
                className="input input-bordered bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="description" className="label">
                <span className="label-text text-xl">Description</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Enter description"
                className="textarea textarea-bordered rounded-xl bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="image" className="label">
                <span className="label-text text-xl">Asset Image</span>
              </label>
              <input
                id="image"
                type="file"
                onChange={handleImageUpload}
                className="file-input file-input-bordered file-input-ghost w-full bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
              />
            </div>

            <div className="form-control">
              <label htmlFor="price" className="label">
                <span className="label-text text-xl">Price</span>
              </label>
              <EtherInput name="price" placeholder="Enter price" value={formData.price} onChange={handlePriceChange} />
            </div>

            <h2 className="text-2xl text-center p-4">Additional Details</h2>

            <p className="text-left">
              Please provide as much information as possible for the best experience for your buyers.
            </p>

            {useApi === undefined ? (
              <>
                <p className="text-left">
                  Would you like to use public APIs to automatically populate this information?
                </p>
                <div className="form-control flex flex-col items-center gap-4 p-4">
                  <button type="button" onClick={() => setUseApi(true)} className="btn btn-wide btn-primary ">
                    <span>Yes</span>
                  </button>
                  <button type="button" onClick={() => setUseApi(false)} className="btn">
                    <span className="text-xs">Enter manually instead</span>
                  </button>
                </div>
              </>
            ) : useApi ? (
              <></>
            ) : (
              <ManualFormInputs
                handleChange={handleFieldChange}
                manualFields={manualFields}
                handleAddField={handleAddField}
                handleRemoveField={handleRemoveField}
              />
            )}

            <div className="form-control p-12">
              <button type="submit" className="btn btn-primary">
                Create Passport
              </button>
            </div>
          </form>
        </main>
        <aside className="w-full md:w-3/4  h-full">
          <div className="p-4 mt-24">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-500">Passport Thumbnail Preview</h2>
            <div className="flex justify-center">
              <BaseThumbnail
                img={formData.image}
                assetCategory={formData.category}
                numberOfCertifiers={0}
                numberOfWarranties={0}
              />
            </div>
          </div>

          <div className="form-control flex flex-col justify-center items-center p-4">
            {useApi === undefined ? (
              <></>
            ) : useApi ? (
              apiData ? (
                <>
                  <h2 className="text-2xl text-center p-4">Additional Details for your RWA NFT</h2>
                  <ApiDataDisplay apiData={apiData} />
                </>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <span className="loading loading-dots loading-md"></span>
                </div>
              )
            ) : (
              <>
                <h2 className="text-2xl text-center p-4">Additional Details for your RWA NFT</h2>
                <ManualFormInputs
                  handleChange={handleFieldChange}
                  manualFields={manualFields}
                  handleAddField={handleAddField}
                  handleRemoveField={handleRemoveField}
                />
              </>
            )}
          </div>
        </aside>

        {isModalOpen && (
          <dialog id="mint-modal" className="modal modal-open">
            {/* {fullNFTImageURI ? ( */}
            <div className="modal-box">
              {currentModalPage === 1 && (
                <div className="form-control w-full p-4 flex flex-col justify-center items-center">
                  <h2 className="text-2xl text-center p-4">Legal Contract</h2>
                  <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                    <p className="text-center">Please review the legal contract below and click the button to sign.</p>

                    <LegalContract
                      DID={formData.DID || ""}
                      walletAddress={accountState.address || ""}
                      handleLegalContractData={handleLegalContractData}
                    />

                    <FormButtons previousPage={previousPage} />
                  </form>
                </div>
              )}

              {currentModalPage === 2 && (
                <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center">
                  <h2 className="text-2xl text-center p-4 ml-10">Review and Submit</h2>
                  <form className="flex flex-col justify-around" onSubmit={nextPage}>
                    <div className="container overflow-auto h-max json-view rounded-lg p-4">
                      <pre>
                        <code>
                          {JSON.stringify(
                            { ...formData, legalContractData, additionalDetails: apiData ? apiData : manualFields },
                            null,
                            2,
                          )}
                        </code>
                      </pre>
                    </div>
                    <div className="flex justify-center py-6">
                      <button onClick={handleIpfsSubmit} className="btn btn-wide dark:btn-accent btn-primary">
                        Submit to IPFS
                      </button>
                    </div>

                    <FormButtons previousPage={previousPage} />
                  </form>
                </div>
              )}

              {currentModalPage === 3 && (
                <>
                  <h2 className="text-xl text-center">Successfully Uploaded!</h2>
                  <p className="text-center">Click below to mint your RWA NFT.</p>
                  <div className="flex justify-center p-8">
                    <button
                      type="button"
                      onClick={mintNFT}
                      className="btn btn-wide btn-lg dark:btn-accent btn-primary "
                    >
                      Mint NFT
                    </button>
                  </div>
                </>
              )}

              <ul className="steps ml-24">
                <li
                  className={
                    currentModalPage >= 1
                      ? `step text-sm ${isDarkTheme ? "step-accent" : "step-primary"}`
                      : "step text-sm"
                  }
                >
                  <button onClick={() => setCurrentModalPage(1)} className="whitespace-normal w-20">
                    Legal Contract
                  </button>
                </li>
                <li
                  className={
                    currentModalPage >= 2
                      ? `step text-sm ${isDarkTheme ? "step-accent" : "step-primary"}`
                      : "step text-sm"
                  }
                >
                  <button onClick={() => setCurrentModalPage(2)} className="whitespace-normal w-20">
                    Submit to IPFS
                  </button>
                </li>
                <li
                  className={
                    currentModalPage >= 3
                      ? `step text-sm ${isDarkTheme ? "step-accent" : "step-primary"}`
                      : "step text-sm"
                  }
                >
                  <button onClick={() => setCurrentModalPage(3)} className="whitespace-normal w-20">
                    Mint
                  </button>
                </li>
              </ul>
            </div>
            {/* ) : (
                <div className="flex justify-center items-center h-full">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              )} */}
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setIsModalOpen(false)}>close</button>
            </form>
          </dialog>
        )}
      </div>
    </div>
  );
};

export default MattereumPassport;
