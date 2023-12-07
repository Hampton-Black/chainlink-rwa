import SellerDashboard from "./seller-dashboard";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import PolygonIDVerifier from "~~/components/PolygonIDVerifier";
import { useAccess } from "~~/contexts/AccessContext";

const Home: NextPage = () => {
  const access = useAccess();

  if (!access) {
    return null;
  }

  const { provedKYCAccess, setProvedKYCAccess, setUserType } = access;

  return (
    <>
      {provedKYCAccess ? (
        <SellerDashboard />
      ) : (
        <>
          <MetaHeader />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10">
            <div className="card w-96 bg-primary text-primary-content hover:scale-105 transition-transform duration-300">
              <div className="card-body">
                <h2 className="card-title">Buyer</h2>
                <p>
                  Register as a buyer, using KYC/AML checks privately and securely through Polygon ID and ZK Proof
                  technology
                </p>

                <span>
                  Buy certified RWA NFTs for digital and physical ownership rights, as well as{" "}
                  <em>the physical item itself!</em> This platform includes built-in legal and regulatory protections.
                </span>
                <div className="card-actions justify-end card:hover:btn-primary">
                  <PolygonIDVerifier
                    publicServerURL={process.env.NEXT_PUBLIC_VERIFICATION_SERVER_PUBLIC_URL}
                    localServerURL={process.env.NEXT_PUBLIC_VERIFICATION_SERVER_LOCAL_HOST_URL}
                    credentialType={"KYCAgeCredential"}
                    issuerOrHowToLink={
                      "https://oceans404.notion.site/How-to-get-a-Verifiable-Credential-f3d34e7c98ec4147b6b2fae79066c4f6?pvs=4"
                    }
                    onVerificationResult={(result: boolean) => {
                      setProvedKYCAccess(result);
                      setUserType("buyer");
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="card w-96 bg-primary text-primary-content hover:scale-105 transition-transform duration-300">
              <div className="card-body">
                <h2 className="card-title">Seller</h2>
                <p>
                  Register as a seller, using KYC/AML checks privately and securely through Polygon ID and ZK Proof
                  technology.
                </p>
                <span>
                  Register your <em>Real World Asset</em> as a specialized NFT with built-in legal and regulatory
                  protections.
                </span>

                <div className="card-actions justify-end">
                  <PolygonIDVerifier
                    publicServerURL={process.env.NEXT_PUBLIC_VERIFICATION_SERVER_PUBLIC_URL}
                    localServerURL={process.env.NEXT_PUBLIC_VERIFICATION_SERVER_LOCAL_HOST_URL}
                    credentialType={"KYCAgeCredential"}
                    issuerOrHowToLink={
                      "https://oceans404.notion.site/How-to-get-a-Verifiable-Credential-f3d34e7c98ec4147b6b2fae79066c4f6?pvs=4"
                    }
                    onVerificationResult={(result: boolean) => {
                      setProvedKYCAccess(result);
                      setUserType("seller");
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="card w-96 bg-primary text-primary-content hover:scale-105 transition-transform duration-300">
              <div className="card-body">
                <h2 className="card-title">Certifier</h2>
                <p>
                  Register as a certifier, after proving your credentials and qualifications as a System Matter Expert
                  in various fields.
                </p>
                <span>
                  Certify NFTs as a trusted third party and increase earning potential based on a revenue sharing model
                  with the platform.
                </span>
                <div className="card-actions justify-end">
                  <PolygonIDVerifier
                    publicServerURL={process.env.NEXT_PUBLIC_VERIFICATION_SERVER_PUBLIC_URL}
                    localServerURL={process.env.NEXT_PUBLIC_VERIFICATION_SERVER_LOCAL_HOST_URL}
                    credentialType={"KYCAgeCredential"}
                    issuerOrHowToLink={
                      "https://oceans404.notion.site/How-to-get-a-Verifiable-Credential-f3d34e7c98ec4147b6b2fae79066c4f6?pvs=4"
                    }
                    onVerificationResult={(result: boolean) => {
                      setProvedKYCAccess(result);
                      setUserType("certifier");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Home;
