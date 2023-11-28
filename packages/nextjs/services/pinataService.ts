import axios from "axios";

export const pinJSONToIPFS = async (data: string) => {
  const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
    },
  });
  return response.data.IpfsHash;
};

export const pinFileToIPFS = async (pinataFormData: FormData) => {
  const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", pinataFormData, {
    maxBodyLength: Infinity,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${(pinataFormData as any)._boundary}`,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
    },
  });
  return response.data.IpfsHash;
};
