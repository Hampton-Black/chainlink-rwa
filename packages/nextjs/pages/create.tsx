import { useEffect, useState } from "react";
import axios from "axios";
import { NextPage } from "next";
import { ApiDataDisplay } from "~~/components/ApiDataDisplay";
import { ManualFormInputs } from "~~/components/ManualFormInputs";
import { EtherInput } from "~~/components/scaffold-eth";
import BaseThumbnail from "~~/public/baseThumbnail.svg";

interface FormState {
  title: string;
  category: string;
  location: string;
  description: string;
  image: File | null;
  price: string;
  expiryDate: Date;
}

const MattereumPassport: NextPage = () => {
  const [formData, setFormData] = useState<FormState>({
    title: "",
    category: "",
    location: "",
    description: "",
    image: null,
    price: "",
    expiryDate: new Date(),
  });
  const [useApi, setUseApi] = useState<boolean | undefined>(undefined);
  const [apiData, setApiData] = useState(null);
  const [manualFields, setManualFields] = useState([{ key: "", value: "" }]);

  const assetCategories = [
    "Real Estate",
    "Luxury Goods",
    "Art & Collectibles",
    "Precious Metals",
    "Fine Wine & Spirits",
    "IP & Patents",
    "Vehicles",
    "Other",
  ];

  // A generic input change handler to update the form state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePriceChange = (newValue: string) => {
    setFormData({
      ...formData,
      price: newValue,
    });
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

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement form submission logic here
    console.log(formData);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFormData({
        ...formData,
        image: event.target.files[0],
      });
    }
  };

  // Fetch data from the API when useApi changes
  useEffect(() => {
    if (useApi) {
      // Split the full address into parts around comma (i.e. "4525 Dean Martin Dr, Las Vegas, NV 12434")
      const [street, rest] = formData.location.split(",").map(part => part.trim());
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
  }, [useApi, formData.location]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container mx-auto flex flex-col md:flex-row">
        <main className="w-full md:w-1/4 bg-white p-8 shadow-md">
          <h1 className="text-2xl font-bold mb-8 text-center">Create New Passport</h1>
          {/* Form inputs and buttons */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label htmlFor="title" className="label">
                <span className="label-text text-xl">Title</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., Mattereum"
                className="input input-bordered bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="category" className="label">
                <span className="label-text text-xl">Category</span>
              </label>
              <select
                id="category"
                name="category"
                className="select select-bordered bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Select a category</option>
                {assetCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label htmlFor="location" className="label">
                <span className="label-text text-xl">Location of Asset</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="123 Main St, New York, NY 10001"
                className="input input-bordered bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="description" className="label">
                <span className="label-text text-xl">Description</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Enter description"
                className="textarea textarea-bordered rounded-xl bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="image" className="label">
                <span className="label-text text-xl">Asset Image</span>
              </label>
              <input
                id="image"
                type="file"
                onChange={handleImageUpload}
                className="file-input file-input-bordered file-input-ghost w-full bg-base-200 font-medium placeholder:text-accent/50 text-gray-400"
              />
            </div>

            <div className="form-control">
              <label htmlFor="price" className="label">
                <span className="label-text text-xl">Price</span>
              </label>
              <EtherInput name="price" placeholder="Enter price" value={formData.price} onChange={handlePriceChange} />
            </div>

            <div className="form-control p-12">
              <button type="submit" className="btn btn-primary">
                Create Passport
              </button>
            </div>
          </form>
        </main>
        <aside className="w-full md:w-3/4  h-full">
          <div className="p-4 mt-24">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-500">Passport Thumbnail Preview</h2>
            <div className="flex justify-center">
              <BaseThumbnail />
            </div>
          </div>

          <div className="form-control flex flex-col justify-center items-center p-4">
            <h2 className="text-2xl text-center p-4">Additional Details for your RWA NFT</h2>
            <form onSubmit={handleSubmit} className="flex flex-col justify-around h-full">
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
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MattereumPassport;
