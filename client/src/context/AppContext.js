import { createContext, useContext } from "react";

// The context lives in its own module so the provider file only exports a
// component (keeps Fast Refresh working).
export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);
