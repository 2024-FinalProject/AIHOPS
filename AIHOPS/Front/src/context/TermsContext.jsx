import React, { createContext, useState, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../constants";

const TermsContext = createContext();
const socket = io(API_URL);

export const TermsProvider = ({ children }) => {
  const [termsText, setTermsText] = useState("");
  const [termsVersion, setTermsVersion] = useState(-1);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected (client side)");
      socket.emit("request_terms");
    });

    socket.on("get_terms", (data) => {
      console.log("Received terms:", data);
      setTermsText(data.tac_text);
      setTermsVersion(data.version);
    });

    socket.on("terms_updated", (data) => {
      console.log("Terms updated:", data);
      setTermsText(data.tac_text);
      setTermsVersion(data.version);
    });

    return () => {
      socket.off("get_terms");
      socket.off("terms_updated");
    };
  }, []);

  return (
    <TermsContext.Provider value={{ termsText, termsVersion }}>
      {children}
    </TermsContext.Provider>
  );
};

export const useTerms = () => useContext(TermsContext);
