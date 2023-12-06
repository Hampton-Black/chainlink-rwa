// import your useAccess hook
import Link from "next/link";
import { useRouter } from "next/router";
import { useAccess } from "~~/contexts/AccessContext";

interface ProtectedLinkProps {
  href: string;
  children: React.ReactNode;
}

export function ProtectedLink({ href, children }: ProtectedLinkProps) {
  const access = useAccess();
  const router = useRouter();

  const isActive = router.pathname === href;

  const handleClick = (e: React.MouseEvent) => {
    if (!access?.provedKYCAccess) {
      e.preventDefault();

      // Redirect to home page to start KYC process
      router.push("/");
    }
  };

  return (
    <Link
      href={href}
      passHref
      onClick={handleClick}
      className={`${
        isActive ? "bg-secondary shadow-md" : ""
      } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
    >
      {children}
    </Link>
  );
}
