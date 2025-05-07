import { createContext, useContext, useState, useEffect } from "react";
import io from "socket.io-client";
import { acceptTermsAndConditions } from "../api/AuthApi";

const TermsContext = createContext();
const socket = io("http://localhost:5555");

socket.on("connect", () => console.log("Socket connected (client side)"));
socket.on("connect_error", (err) =>
  console.error("Socket connection error:", err)
);

export const TermsProvider = ({ children }) => {
  const [terms, setTerms] = useState({ version: null, tac_text: "" });
  const [requireAccept, setRequireAccept] = useState(false);
  const [userVersion, setUserVersion] = useState(() =>
    localStorage.getItem("termsVersion")
  );

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    socket.on("get_terms", ({ version, tac_text }) => {
      console.log("Received terms:", version);
      setTerms({ version, tac_text });

      if (isLoggedIn && userVersion !== String(version)) {
        setRequireAccept(true);
      }
    });

    socket.on("terms_updated", ({ version, tac_text }) => {
      console.log("Terms updated:", version);
      setTerms({ version, tac_text });

      if (isLoggedIn) {
        setRequireAccept(true);
      }
    });

    return () => {
      socket.off("get_terms");
      socket.off("terms_updated");
    };
  }, [userVersion, isLoggedIn]);

  useEffect(() => {
    if (!terms.tac_text) {
      socket.emit("request_terms");
    }
  }, [terms.tac_text]);

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected, requesting terms...");
      socket.emit("request_terms");
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  const acceptTerms = async () => {
    await acceptTermsAndConditions(
      localStorage.getItem("authToken"),
      terms.version
    );
    setUserVersion(String(terms.version));
    localStorage.setItem("termsVersion", String(terms.version));
    setRequireAccept(false);
  };

  return (
    <TermsContext.Provider value={{ terms, requireAccept, acceptTerms }}>
      {children}
    </TermsContext.Provider>
  );
};

export const useTerms = () => useContext(TermsContext);
