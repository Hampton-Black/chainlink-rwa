import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AddressInput } from "~~/components/scaffold-eth";

const SellerRegistration: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    walletAddress: "",
  });
  const accountState = useAccount();

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const previousPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  // Update the walletAddress field when the user connects their wallet
  useEffect(() => {
    if (accountState.address) {
      setFormData(prevFormData => ({ ...prevFormData, walletAddress: accountState.address ?? "" }));
    }
  }, [accountState.address]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-3 justify-center items-center">
          <h1 className="text-4xl text-center mt-10">Seller Registration</h1>
        </div>

        <div className="col-span-1 ml-48 p-4">
          <ul className="steps steps-vertical">
            <li className={currentPage >= 1 ? "step step-primary" : "step"}>Register with PolygonID</li>
            <li className={currentPage >= 2 ? "step step-primary" : "step"}>Choose Asset Type</li>
            <li className={currentPage >= 3 ? "step step-primary" : "step"}>Provide Additional Details</li>
            <li className={currentPage >= 4 ? "step step-primary" : "step"}>Review and Submit</li>
          </ul>
        </div>

        <div className="col-span-1 flex items-center justify-center">
          {/* Registration form goes here */}

          {currentPage === 1 && (
            <div className="form-control w-full max-w-lg p-4">
              <form onSubmit={nextPage} className="flex flex-col justify-around h-full">
                <label className="label justify-between">
                  <span className="label-text" style={{ width: "100px" }}>
                    First Name:
                  </span>
                  <input
                    type="text"
                    placeholder="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </label>

                <label className="label">
                  <span className="label-text" style={{ width: "100px" }}>
                    Last Name:
                  </span>
                  <input
                    type="text"
                    placeholder="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </label>

                <label className="label">
                  <span className="label-text">Wallet Address:</span>
                  <AddressInput
                    onChange={(newValue: string) => setFormData({ ...formData, walletAddress: newValue })}
                    value={formData.walletAddress}
                    placeholder="Wallet Address"
                    name="walletAddress"
                  />
                </label>
                <div className="self-end p-4">
                  <button type="submit" className="btn btn-sm btn-outline">
                    Next
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentPage === 2 && (
            <form onSubmit={nextPage}>
              <label>
                Email:
                {/* <input type="email" name="email" value={formData.email} onChange={handleChange} /> */}
              </label>
              <label>
                Password:
                {/* <input type="password" name="password" value={formData.password} onChange={handleChange} /> */}
              </label>
              {/* Add more form fields for page 2 */}
              <button type="submit">Next</button>
              <button type="button" onClick={previousPage}>
                Previous
              </button>
            </form>
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
