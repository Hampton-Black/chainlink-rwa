import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { AddressInputField } from "~~/components/AddressInputField";
import { FormInput } from "~~/components/FormInput";
import { StepList } from "~~/components/StepList";

const SellerRegistration: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    walletAddress: "",
    assetType: "",
  });
  const [selectedOption, setSelectedOption] = useState("");
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

  const handleAddressChange = (newValue: string) => {
    handleChange({
      target: {
        name: "walletAddress",
        value: newValue,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
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

  //   console.log(formData);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-3 justify-center items-center">
          <h1 className="text-4xl text-center mt-10">Seller Registration</h1>
        </div>

        <div className="col-span-1 ml-48 p-4">
          <StepList currentPage={currentPage} onStepClick={onStepClick} />
        </div>

        <div className="col-span-1 flex items-center justify-center">
          {/* Registration form goes here */}

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
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <label
                      key={i}
                      className={`flex flex-col items-center justify-between p-4 rounded ${
                        selectedOption === `option${i + 1}` ? "border-blue-500 border-2" : "border-gray-200 border"
                      }`}
                      style={{ cursor: "pointer", width: "200px", height: "200px" }}
                    >
                      <input
                        type="radio"
                        name="assetType"
                        value={`option${i + 1}`}
                        onChange={handleChange}
                        className="appearance-none w-0 h-0"
                      />
                      <Image src={`/icon${i + 1}.svg`} alt={`Option ${i + 1}`} width={64} height={64} />
                      <span>{optionMapping[`option${i + 1}` as keyof typeof optionMapping]}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button type="button" onClick={previousPage} className="btn btn-sm btn-outline">
                    Previous
                  </button>
                  <button type="submit" className="btn btn-sm btn-outline">
                    Next
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add more pages as needed */}

          {currentPage === 3 && (
            <form onSubmit={handleSubmit}>
              {/* Add form fields for the final page */}
              <button type="submit">Submit</button>
              <button type="button" onClick={previousPage}>
                Previous
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;
