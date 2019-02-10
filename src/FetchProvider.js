import React, { useContext } from "react";
const FetchContext = React.createContext(null);

export const useFetchContext = () => {
  const cache = useContext(FetchContext);

  return cache;
};

function FetchProvider({ cache, children }) {
  return (
    <FetchContext.Provider value={cache}>{children}</FetchContext.Provider>
  );
}

export { FetchProvider };
