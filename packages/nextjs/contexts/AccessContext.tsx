import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useState } from "react";

interface AccessContextValue {
  provedKYCAccess: boolean;
  setProvedKYCAccess: Dispatch<SetStateAction<boolean>>;
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

  const value = {
    provedKYCAccess,
    setProvedKYCAccess,
  };

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
