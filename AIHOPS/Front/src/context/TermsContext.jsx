import React, { createContext, useState, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../constants";
import { acceptNewTerms } from "../api/AuthApi";

const TermsContext = createContext();
const socket = io("https://aihops.cs.bgu.ac.il", {
  transports: ["websocket"], // or ["polling", "websocket"]
  secure: true,
});

export const TermsProvider = ({ children }) => {
  const [termsText, setTermsText] = useState("");
  const [termsVersion, setTermsVersion] = useState(-1);
  const [mustAcceptNewTerms, setMustAcceptNewTerms] = useState(false);

  const acceptTerms = async () => {
    const response = await acceptNewTerms(termsVersion);
    if (!response.data.success) {
      alert("failed to accept terms and conditions please reload");
      return;
    }
    setMustAcceptNewTerms(false);
  };

  useEffect(() => {
    socket.on("connect", () => {
      // console.log("Socket connected (client side)");
      socket.emit("request_terms");
    });

    socket.on("get_terms", (data) => {
      // console.log("Received terms:", data);
      setTermsText(data.tac_text);
      setTermsVersion(data.version);
    });

    socket.on("terms_updated", (data) => {
      // console.log("Terms updated:", data);
      setTermsText(data.tac_text);
      setTermsVersion(data.version);
      setMustAcceptNewTerms(true);
    });

    return () => {
      socket.off("get_terms");
      socket.off("terms_updated");
    };
  }, []);

  return (
    <TermsContext.Provider
      value={{
        termsText,
        termsVersion,
        mustAcceptNewTerms,
        setMustAcceptNewTerms,
        acceptTerms,
      }}
    >
      {children}
    </TermsContext.Provider>
  );
};

export const useTerms = () => useContext(TermsContext);
