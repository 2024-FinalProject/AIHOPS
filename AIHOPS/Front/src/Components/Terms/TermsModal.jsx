import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./TermsModal.css";

const TermsModal = ({ text, version, onAccept }) => {
  const contentRef = useRef(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = () => {
    const el = contentRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setScrolledToBottom(true);
    }
  };

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="tac-modal-overlay">
      <div className="tac-modal">
        <h2>Terms and Conditions (v{version})</h2>
        <div className="tac-modal-content" ref={contentRef}>
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        <div className="tac-modal-actions">
          <button onClick={onAccept} disabled={!scrolledToBottom}>
            {scrolledToBottom ? "I Accept" : "Scroll to bottom to accept"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
