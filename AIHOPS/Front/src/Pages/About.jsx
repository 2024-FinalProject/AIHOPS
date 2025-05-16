import React from "react";
import aihops_article from "../assets/AIHOPS.pdf";
import ReactMarkdown from "react-markdown";
import { useEffect } from "react";
import { useState } from "react";
import { useContext } from "react";
import { fetchAbout } from "../api/AdminApi";
import "./About.css";

const About = () => {
  const [aboutText, setAboutText] = useState(" ");

  useEffect(() => {
    const fetchAboutContent = async () => {
      console.log("Fetching about content...");
      const response = await fetchAbout();
      if (response.data.result) {
        setAboutText(response.data.result);
      } else {
        console.error("Failed to fetch about text");
      }
    };
    fetchAboutContent();
  }, []);

  return (
    <div className="about-header">
      <h1 style={{ textAlign: "center" }}>About AIHOPS </h1>
      <div className="about-container">
        <div className="about-card">
          <div className="about-content">
            <ReactMarkdown>{aboutText}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
