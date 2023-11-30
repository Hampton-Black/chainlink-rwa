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
  <div className="form-control p-1">
    <label className="label">
      <span className="label-text">{label}</span>
    </label>
    <AddressInput onChange={onChange} value={value} placeholder={placeholder} name={name} />
  </div>
);
