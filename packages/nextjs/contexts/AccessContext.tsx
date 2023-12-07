import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useState } from "react";

interface AccessContextValue {
  provedKYCAccess: boolean;
  setProvedKYCAccess: Dispatch<SetStateAction<boolean>>;
  userType: string;
  setUserType: Dispatch<SetStateAction<string>>;
}

const AccessContext = createContext<AccessContextValue | null>(null);
export default AccessContext;

export function useAccess() {
  return useContext(AccessContext);
}

interface AccessProviderProps {
  children: ReactNode;
}

export function AccessProvider({ children }: AccessProviderProps) {
  const [provedKYCAccess, setProvedKYCAccess] = useState(false);
  const [userType, setUserType] = useState("");

  const value = {
    provedKYCAccess,
    setProvedKYCAccess,
    userType,
    setUserType,
  };

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
