import Image from "next/image";

interface AssetTypeSelectionProps {
  selectedOption: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  optionMapping: { [key: string]: string };
}

export const AssetTypeSelection: React.FC<AssetTypeSelectionProps> = ({
  selectedOption,
  handleChange,
  optionMapping,
}) => {
  return (
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
  );
};
