import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AssetTypeSelection } from "./../components/AssetTypeSelection";
import LegalContract from "./../components/LegalContract";
import axios from "axios";
import { ethers } from "ethers";
import { NextPage } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { useAccount } from "wagmi";
import { AddressInputField } from "~~/components/AddressInputField";
import { ApiDataDisplay } from "~~/components/ApiDataDisplay";
import BaseThumbnail from "~~/components/BaseThumbnail";
import { FormButtons } from "~~/components/FormButtons";
import { FormInput } from "~~/components/FormInput";
import { ManualFormInputs } from "~~/components/ManualFormInputs";
import { StepList } from "~~/components/StepList";
import { EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { pinFileToIPFS, pinJSONToIPFS } from "~~/services/pinataService";

interface UserFormData {
  firstName: string;
  lastName: string;
  walletAddress: string;
  assetType: string;
  assetName: string;
  assetLocation: string;
  uploadedImageIPFSHash: string;
  listPrice: string;
}

interface LegalContractData {
  signature: string;
  contractURI: string;
}

const SellerRegistration: NextPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    walletAddress: "",
    assetType: "",
    assetName: "",
    assetLocation: "",
    uploadedImageIPFSHash: "",
    listPrice: "",
  });
  const [selectedOption, setSelectedOption] = useState("");
  const [useApi, setUseApi] = useState<boolean | undefined>(undefined);
  const [apiData, setApiData] = useState(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualFields, setManualFields] = useState([{ key: "", value: "" }]);
  const [legalContractData, setLegalContractData] = useState<LegalContractData | null>(null);
  const [fullMetadataURI, setFullMetadataURI] = useState("");
  const [fullNFTImageURI, setFullNFTImageURI] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const accountState = useAccount();

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "RealWorldAsset",
    functionName: "mint",
    args: [undefined, undefined, undefined, undefined],
    // For payable functions
    value: undefined,
    // The number of block confirmations to wait for before considering transaction to be confirmed (default : 1).
    blockConfirmations: 1,
    // The callback function to execute when the transaction is confirmed.
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const optionMapping = {
    option1: "Real Estate",
    option2: "Luxury Goods",
    option3: "Art & Collectibles",
    option4: "Precious Metals",
    option5: "Fine Wine & Spirits",
    option6: "IP & Patents",
    option7: "Vehicles",
    option8: "Other",
  };

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const previousPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleLegalContractData = (signature: string, contractURI: string) => {
    setLegalContractData({ signature, contractURI });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.name === "assetType" ? optionMapping[e.target.value as keyof typeof optionMapping] : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value,
    });

    if (e.target.name === "assetType") {
      setSelectedOption(e.target.value);
    }
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

  const handleAddressChange = (newValue: string) => {
    handleChange({
      target: {
        name: "walletAddress",
        value: newValue,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // format data for submission to Pinata
    const fullMetadata = { ...formData, legalContractData, additionalDetails: apiData ? apiData : manualFields };

    const data = JSON.stringify({
      pinataContent: {
        ...fullMetadata,
      },
      pinataMetadata: {
        name: "Full Metadata for RWA NFT " + formData.assetName + " " + formData.assetType,
        keyvalues: {
          date: new Date().toISOString().split("T")[0],
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    });

    // Serialize the SVG to a string
    const svgString = renderToStaticMarkup(
      <BaseThumbnail
        img={formData.uploadedImageIPFSHash}
        assetCategory={formData.assetType}
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
      name: "Full RWA NFT Thumbnail for: " + formData.assetName + ", " + formData.assetType,
    });
    pinataFormData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append("pinataOptions", options);

    try {
      // open modal
      setIsModalOpen(true);

      const metadataURI = await pinJSONToIPFS(data);
      const nftImageURI = await pinFileToIPFS(pinataFormData);
      console.log(metadataURI);
      console.log(nftImageURI);
      setFullMetadataURI(metadataURI);
      setFullNFTImageURI(nftImageURI);
    } catch (error) {
      console.error("Error pinning to IPFS: ", error);
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
      formData.assetName,
      formData.assetType,
      formData.assetLocation,
      fullMetadataURI,
      fullNFTImageURI,
      signatureBytes,
      legalContractData?.contractURI ?? "",
    ];

    const abiEncodedData = abiEncoder.encode(types, values);
    const abiEncodedDataWithoutPrefix = abiEncodedData.substring(2);

    // call the contract
    await writeAsync({
      args: [accountState.address, BigInt(3), BigInt(1), `0x${abiEncodedDataWithoutPrefix}`],
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setUploadedFile(file);
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImage(reader.result);
        }
      };

      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
  };

  const handleImageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // submit to Pinata first
    const pinataFormData = new FormData();
    pinataFormData.append("file", uploadedFile as Blob);

    const metadata = JSON.stringify({
      name: "RWA NFT Thumbnail center image for: " + formData.assetName + ", " + formData.assetType,
    });
    pinataFormData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append("pinataOptions", options);

    nextPage();

    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", pinataFormData, {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${(pinataFormData as any)._boundary}`,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
        },
      });
      console.log(response.data);
      setFormData({
        ...formData,
        uploadedImageIPFSHash: response.data.IpfsHash,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const onStepClick = (stepNumber: number) => {
    setCurrentPage(stepNumber);
  };

  // Update the walletAddress field when the user connects their wallet
  useEffect(() => {
    if (accountState.address) {
      setFormData(prevFormData => ({ ...prevFormData, walletAddress: accountState.address ?? "" }));
    }
  }, [accountState.address]);

  // Fetch data from the API when useApi changes
  useEffect(() => {
    if (useApi) {
      // Split the full address into parts around comma (i.e. "4525 Dean Martin Dr, Las Vegas, NV 12434")
      const [street, city, state] = formData.assetLocation.split(",");
      // Split the rest of the address into parts around the last space (i.e. "Las Vegas, NV 12434"), discarding the last part (i.e. "12434")

      const address1 = street;
      const address2 = city + ", " + state;

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
  }, [useApi, formData.assetLocation]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-3 justify-center items-center">
          <h1 className="text-4xl text-center mt-10">Seller Registration</h1>
        </div>

        <div className="col-span-1 ml-48 p-4 flex flex-col items-end">
          <StepList currentPage={currentPage} onStepClick={onStepClick} />
        </div>

        <div className="col-span-2 grid grid-cols-2 items-center justify-center">
          {currentPage === 1 && (
            <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center ml-36">
              <h2 className="text-2xl text-center p-4">Basic Info to register with Polygon ID</h2>

              <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                <FormInput
                  label="First Name:"
                  placeholder="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />

                <FormInput
                  label="Last Name:"
                  placeholder="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />

                <AddressInputField
                  label="Wallet Address:"
                  placeholder="Wallet Address"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleAddressChange}
                />
                <div className="self-end p-4">
                  <button type="submit" className="btn btn-sm btn-outline">
                    Next
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentPage === 2 && (
            <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center ml-36">
              <h2 className="text-2xl text-center p-4">Choose your Asset Type</h2>
              <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                <AssetTypeSelection
                  selectedOption={selectedOption}
                  handleChange={handleChange}
                  optionMapping={optionMapping}
                />

                <FormButtons previousPage={previousPage} />
              </form>
            </div>
          )}

          {currentPage === 3 && (
            <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center ml-36">
              <h2 className="text-2xl text-center p-4">Required Data to mint your RWA NFT</h2>
              <form onSubmit={handleImageSubmit} className="flex flex-col justify-around h-full">
                <FormInput
                  label="Asset Name:"
                  placeholder="Name of Asset"
                  name="assetName"
                  value={formData.assetName}
                  onChange={handleChange}
                />

                <FormInput
                  label="Asset Location:"
                  placeholder="Location/Address of Asset"
                  name="assetLocation"
                  value={formData.assetLocation}
                  onChange={handleChange}
                />

                <div className="form-control">
                  <label htmlFor="price" className="label">
                    <span className="label-text">Price:</span>
                  </label>
                  <EtherInput
                    name="listPrice"
                    placeholder="Enter price"
                    value={formData.listPrice}
                    onChange={value =>
                      handleChange({ target: { name: "listPrice", value } } as React.ChangeEvent<HTMLInputElement>)
                    }
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Asset Image (For NFT Thumbnail):</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    className="file-input file-input-bordered file-input-accent w-full"
                  />
                  {image && (
                    <div className="flex justify-center items-center p-2 mt-4">
                      <Image src={image} alt="Uploaded Image" width={500} height={500} className="rounded-lg" />
                    </div>
                  )}
                </div>

                <FormButtons previousPage={previousPage} />
              </form>
            </div>
          )}

          {currentPage === 4 && (
            <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center ml-36">
              <h2 className="text-2xl text-center p-4">Additional Details for your RWA NFT</h2>
              <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                <p className={`text-justify p-2 ${apiData ? "ml-36" : ""}`}>
                  Please provide as much information as possible for the best experience for your buyers.
                </p>

                {useApi === undefined ? (
                  <>
                    <p className="text-justify p-2">
                      Would you like to use public APIs to automatically populate this information?
                    </p>
                    <div className="flex gap-4 p-4">
                      <button type="button" onClick={() => setUseApi(false)} className="btn">
                        <span className="text-xs">Enter manually instead</span>
                      </button>
                      <button type="button" onClick={() => setUseApi(true)} className="btn btn-wide btn-primary ">
                        <span>Yes</span>
                      </button>
                    </div>
                  </>
                ) : useApi ? (
                  apiData ? (
                    <ApiDataDisplay apiData={apiData} />
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <span className="loading loading-dots loading-md"></span>
                    </div>
                  )
                ) : (
                  <ManualFormInputs
                    handleChange={handleFieldChange}
                    manualFields={manualFields}
                    handleAddField={handleAddField}
                    handleRemoveField={handleRemoveField}
                  />
                )}

                <div className={`${apiData ? "ml-36" : ""}`}>
                  <FormButtons previousPage={previousPage} />
                </div>
              </form>
            </div>
          )}

          {/* create a new page that shows the legal contract and a button to sign */}
          {currentPage === 5 && (
            <div className="form-control w-full p-4 flex flex-col justify-center items-center ml-12">
              <h2 className="text-2xl text-center p-4">Legal Contract</h2>
              <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                <p className="text-center">Please review the legal contract below and click the button to sign.</p>

                <LegalContract
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  walletAddress={formData.walletAddress}
                  handleLegalContractData={handleLegalContractData}
                />

                <FormButtons previousPage={previousPage} />
              </form>
            </div>
          )}

          {currentPage === 6 && (
            <>
              <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center ml-36">
                <h2 className="text-2xl text-center p-4 ml-10">Review and Submit</h2>
                <form className="flex flex-col justify-end items-center" onSubmit={handleFinalSubmit}>
                  <div className="container overflow-auto h-max w-1/2 json-view rounded-lg p-4 ml-36">
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

                  <div className="flex justify-start pt-4 ml-36">
                    <button type="button" onClick={previousPage} className="btn btn-sm btn-outline">
                      Previous
                    </button>
                  </div>
                  <div className="flex justify-center pt-4 ml-36 h-96">
                    <button type="submit" className="btn btn-wide btn-lg dark:btn-accent btn-primary">
                      Submit to IPFS
                    </button>
                  </div>
                </form>
              </div>
              <div className="self-start sticky top-2 right-8 col-start-3 row-start-1 ml-24 mt-10">
                <BaseThumbnail
                  img={formData.uploadedImageIPFSHash}
                  assetCategory={formData.assetType}
                  numberOfCertifiers={0}
                  numberOfWarranties={0}
                />
              </div>
              {isModalOpen && (
                <dialog id="mint-modal" className="modal modal-open">
                  {fullMetadataURI && fullNFTImageURI ? (
                    <div className="modal-box text-center">
                      <h2 className="text-xl">Successfully Uploaded!</h2>
                      <p>Click below to mint your RWA NFT.</p>
                      <div className="flex justify-center p-4">
                        <button
                          type="button"
                          onClick={mintNFT}
                          className="btn btn-wide btn-lg dark:btn-accent btn-primary "
                        >
                          Mint NFT
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  )}
                  <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsModalOpen(false)}>close</button>
                  </form>
                </dialog>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;
