import React, { createContext, useState, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../constants";
import { acceptNewTerms } from "../api/AuthApi";

const TermsContext = createContext();
const socket = io(API_URL);

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
    let requested = false;

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
      setMustAcceptNewTerms(true);
    });

    // Fallback if terms are not received within 2 seconds
    const fallback = setTimeout(() => {
      if (termsVersion === -1 && !requested && socket.connected) {
        console.warn("Manually requesting terms fallback...");
        socket.emit("request_terms");
      }
    }, 2000);

    return () => {
      socket.off("get_terms");
      socket.off("terms_updated");
      clearTimeout(fallback);
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
