import React, { useEffect, useState } from "react";
import { AssetTypeSelection } from "./../components/AssetTypeSelection";
import axios from "axios";
import { useAccount } from "wagmi";
import { AddressInputField } from "~~/components/AddressInputField";
import { ApiDataDisplay } from "~~/components/ApiDataDisplay";
import { FormButtons } from "~~/components/FormButtons";
import { FormInput } from "~~/components/FormInput";
import { ManualFormInputs } from "~~/components/ManualFormInputs";
import { StepList } from "~~/components/StepList";

interface FormData {
  firstName: string;
  lastName: string;
  walletAddress: string;
  assetType: string;
  assetName: string;
  assetLocation: string;
  uploadedImage: File | null;
}

const SellerRegistration: React.FC = () => {
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

        <div className="col-span-1 flex items-center justify-center">
          {currentPage === 1 && (
            <div className="form-control w-full max-w-lg p-4">
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
            <div className="form-control w-full max-w-lg p-4">
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
            <div className="form-control w-full max-w-lg p-4">
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
            <div className="form-control w-full max-w-lg p-4">
              <h2 className="text-2xl text-center p-4">Additional Details for your RWA NFT</h2>
              <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                <p className="text-justify">
                  Please provide as much information as possible for the best experience for your buyers.
                </p>

                {useApi === undefined ? (
                  <>
                    <p className="text-justify">
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

          {currentPage === 6 && (
            <div className="form-control w-full max-w-lg p-4">
              <h2 className="text-2xl text-center p-4">Review and Submit</h2>
              <form onSubmit={handleFinalSubmit}>
                <div className="mockup-code">
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
                <div className="flex justify-end pt-4 absolute bottom-40">
                  <button type="submit" className="btn btn-wide dark:btn-accent btn-primary ">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;
