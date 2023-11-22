import React from "react";
import { AddressInput } from "./scaffold-eth";

interface AddressInputFieldProps {
  label: string;
  placeholder: string;
  name: string;
  value: string;
  onChange: (newValue: string) => void;
}

export const AddressInputField: React.FC<AddressInputFieldProps> = ({ label, placeholder, name, value, onChange }) => (
  <label className="label">
    <span className="label-text">{label}</span>
    <AddressInput onChange={onChange} value={value} placeholder={placeholder} name={name} />
  </label>
);
