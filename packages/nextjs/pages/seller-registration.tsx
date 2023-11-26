import React, { useEffect, useState } from "react";
import { AssetTypeSelection } from "./../components/AssetTypeSelection";
import axios from "axios";
import { NextPage } from "next";
import { useAccount } from "wagmi";
import { AddressInputField } from "~~/components/AddressInputField";
import { ApiDataDisplay } from "~~/components/ApiDataDisplay";
import { FormButtons } from "~~/components/FormButtons";
import { FormInput } from "~~/components/FormInput";
import { ManualFormInputs } from "~~/components/ManualFormInputs";
import { StepList } from "~~/components/StepList";
import BaseThumbnail from "~~/public/baseThumbnail.svg";

interface FormData {
  firstName: string;
  lastName: string;
  walletAddress: string;
  assetType: string;
  assetName: string;
  assetLocation: string;
  uploadedImage: File | null;
}

const SellerRegistration: NextPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    walletAddress: "",
    assetType: "",
    assetName: "",
    assetLocation: "",
    uploadedImage: null,
  });
  const [selectedOption, setSelectedOption] = useState("");
  const [useApi, setUseApi] = useState<boolean | undefined>(undefined);
  const [apiData, setApiData] = useState(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [manualFields, setManualFields] = useState([{ key: "", value: "" }]);
  const accountState = useAccount();

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

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedImage(event.target.files[0]);
    }
  };

  const handleImageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormData({
      ...formData,
      uploadedImage,
    });

    nextPage();
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
      const [street, rest] = formData.assetLocation.split(",").map(part => part.trim());
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

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Asset Image (For NFT Thumbnail):</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    className="file-input file-input-bordered file-input-accent w-full"
                  />
                </div>

                <FormButtons previousPage={previousPage} />
              </form>
            </div>
          )}

          {currentPage === 4 && (
            <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center ml-36">
              <h2 className="text-2xl text-center p-4 ml-12">Additional Details for your RWA NFT</h2>
              <form onSubmit={nextPage} className="flex flex-col justify-around h-full ml-36">
                <p className="text-center p-2">
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

                <FormButtons previousPage={previousPage} />
              </form>
            </div>
          )}

          {/* create a new page that shows the legal contract and a button to sign */}
          {currentPage === 5 && (
            <div className="form-control w-full p-4 flex flex-col justify-center items-center ml-12">
              <h2 className="text-2xl text-center p-4">Legal Contract</h2>
              <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                <p className="text-center">Please review the legal contract below and click the button to sign.</p>

                <div className="bg-white p-8 my-4 text-justify border border-gray-300 shadow-lg h-96 overflow-auto dark:text-black">
                  <h3 className="font-bold text-2xl mb-4">Contract Title</h3>

                  <p className="mb-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor aliquam lacus, at viverra
                    ante dictum quis. Sed purus sem, scelerisque ac rhoncus eget, porttitor nec odio. Lorem ipsum dolor
                    sit amet, consectetur adipiscing elit. Suspendisse potenti.
                  </p>
                  {Array(3).fill(
                    <>
                      <p className="mb-4">
                        Phasellus et lacinia lorem, id luctus dui. Nulla at semper nisl, at elementum elit. Nunc ut diam
                        quis augue semper venenatis. Fusce sed nibh vitae velit sagittis egestas eu ut tortor. Nam risus
                        erat, tristique at auctor nec, aliquet quis neque.
                      </p>
                      <p className="mb-4">
                        Etiam a neque ut augue mattis gravida vel vel purus. Maecenas id varius velit, at luctus diam.
                        Sed in sem convallis, pulvinar neque a, aliquet ante. Vestibulum ante ipsum primis in faucibus
                        orci luctus et ultrices posuere cubilia curae; Sed libero velit, feugiat et lobortis at,
                        accumsan sed arcu.
                      </p>
                    </>,
                  )}
                </div>

                <div className="flex justify-center py-4">
                  <button type="button" className="btn btn-wide dark:btn-accent btn-primary ">
                    Sign Contract
                  </button>
                </div>

                <FormButtons previousPage={previousPage} />
              </form>
            </div>
          )}

          {currentPage === 6 && (
            <>
              <div className="form-control w-full max-w-lg p-4 flex flex-col justify-center items-center ml-36">
                <h2 className="text-2xl text-center p-4">Review and Submit</h2>
                <form onSubmit={handleFinalSubmit}>
                  <div className="flex container w-full overflow-auto h-96 json-view rounded-lg p-4">
                    <pre>
                      <code>
                        {JSON.stringify(
                          Object.entries(formData).map(([key, value]) => `${key}: ${value}`),
                          null,
                          2,
                        )}
                      </code>
                    </pre>
                  </div>

                  <div className="flex justify-start pt-4">
                    <button type="button" onClick={previousPage} className="btn btn-sm btn-outline">
                      Previous
                    </button>
                  </div>
                  <div className="flex justify-end pt-4 ml-36 absolute bottom-40">
                    <button type="submit" className="btn btn-wide dark:btn-accent btn-primary ">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
              <div className="p-4 mt-16">
                <BaseThumbnail />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;
