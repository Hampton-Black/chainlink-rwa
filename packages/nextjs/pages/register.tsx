import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextPage } from "next";
import { useAccount } from "wagmi";
import { AddressInputField } from "~~/components/AddressInputField";
import { FormInput } from "~~/components/FormInput";

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const accountState = useAccount();

  const { role: queryRole } = router.query;

  const titleCaseRole = queryRole
    ? (queryRole as string).charAt(0).toUpperCase() + (queryRole as string).slice(1).toLowerCase()
    : "";

  const roles = ["Buyer", "Seller", "Certifier"];

  const [registrationData, setRegistrationData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: titleCaseRole,
    walletAddress: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegistrationData({
      ...registrationData,
      [e.target.name]: e.target.value,
    });
  };

  // Update the walletAddress field when the user connects their wallet
  useEffect(() => {
    if (accountState.address) {
      setRegistrationData(prevFormData => ({ ...prevFormData, walletAddress: accountState.address ?? "" }));
    }
  }, [accountState.address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationData({
      ...registrationData,
      [e.target.name]: e.target.value,
    });
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
    // TODO: Implement Polygon ID registration logic

    // Redirect to the dashboards or create page
    if (queryRole === "seller") {
      router.push("/create");
    }
  };

  return (
    <div className=" p-4 flex flex-col justify-center items-center">
      <h2 className="text-2xl text-center p-4">Basic Info to register with Polygon ID</h2>

      <form onSubmit={handleSubmit} className="flex flex-col justify-around h-full">
        <FormInput
          label="First Name:"
          placeholder="First Name"
          name="firstName"
          value={registrationData.firstName}
          onChange={handleChange}
        />

        <FormInput
          label="Last Name:"
          placeholder="Last Name"
          name="lastName"
          value={registrationData.lastName}
          onChange={handleChange}
        />

        <FormInput
          label="Email:"
          placeholder="fullname@gmail.com"
          name="email"
          value={registrationData.email}
          onChange={handleChange}
        />

        <div className="form-control">
          <label htmlFor="roles" className="label">
            <span className="label-text text">Role:</span>
          </label>
          <select
            id="roles"
            name="roles"
            className="select select-bordered bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
            value={registrationData.role}
            onChange={handleInputChange}
          >
            <option value="">Select a role</option>
            {roles.map((role, index) => (
              <option key={index} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <AddressInputField
          label="Wallet Address:"
          placeholder="Wallet Address"
          name="walletAddress"
          value={registrationData.walletAddress}
          onChange={handleAddressChange}
        />

        <div className="self-end p-4">
          <button type="submit" className="btn btn-sm btn-outline">
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
