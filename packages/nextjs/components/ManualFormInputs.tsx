import { FormInput } from "./FormInput";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export const ManualFormInputs: React.FC<{
  manualFields: { key: string; value: string }[];
  handleChange: (index: number, type: "key" | "value", event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddField: () => void;
  handleRemoveField: (index: number) => void;
}> = ({ manualFields, handleChange, handleAddField, handleRemoveField }) => {
  return (
    <div>
      {manualFields.map((field, index) => (
        <div key={index} className="flex justify-center items-center">
          <div>
            <FormInput
              label="Key"
              placeholder="Key"
              name={`key${index}`}
              value={field.key}
              onChange={e => handleChange(index, "key", e)}
            />
            <FormInput
              label="Value"
              placeholder="Value"
              name={`value${index}`}
              value={field.value}
              onChange={e => handleChange(index, "value", e)}
            />
          </div>
          <button className="btn btn-square ml-4" onClick={() => handleRemoveField(index)}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex justify-center items-center p-2">
        <button type="button" className="btn btn-square" onClick={handleAddField}>
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
