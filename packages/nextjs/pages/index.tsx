import Link from "next/link";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10">
        <div className="card w-96 bg-primary text-primary-content hover:scale-105 transition-transform duration-300">
          <Link href="/register?role=buyer">
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
                <button className="btn">Register</button>
              </div>
            </div>
          </Link>
        </div>

        <div className="card w-96 bg-primary text-primary-content hover:scale-105 transition-transform duration-300">
          <Link href="/register?role=seller">
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
                <button className="btn">Register</button>
              </div>
            </div>
          </Link>
        </div>

        <div className="card w-96 bg-primary text-primary-content hover:scale-105 transition-transform duration-300">
          <Link href="/register?role=certifier">
            <div className="card-body">
              <h2 className="card-title">Certifier</h2>
              <p>
                Register as a certifier, after proving your credentials and qualifications as a System Matter Expert in
                various fields.
              </p>
              <span>
                Certify NFTs as a trusted third party and increase earning potential based on a revenue sharing model
                with the platform.
              </span>
              <div className="card-actions justify-end">
                <button className="btn">Register</button>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
