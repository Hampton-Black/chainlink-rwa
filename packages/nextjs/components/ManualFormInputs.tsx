import { FormInput } from "./FormInput";

export const ManualFormInputs: React.FC<{ handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void }> = ({
  handleChange,
}) => {
  // Render your form inputs here, and use handleChange as the onChange handler
  return (
    <div>
      <FormInput label="item 1" placeholder="item 1" name="item1" value="" onChange={handleChange} />
      {/* Add more inputs as needed */}
    </div>
  );
};
