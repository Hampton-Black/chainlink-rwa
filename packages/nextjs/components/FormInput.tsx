import React, { ChangeEvent } from "react";

interface FormInputProps {
  label: string;
  placeholder: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const FormInput: React.FC<FormInputProps> = ({ label, placeholder, name, value, onChange }) => (
  <div className="form-control">
    <label htmlFor={name} className="label justify-between">
      <span className="label-text" style={{ width: "100px" }}>
        {label}
      </span>
    </label>
    <input
      type="text"
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      className="input w-full"
    />
  </div>
);
