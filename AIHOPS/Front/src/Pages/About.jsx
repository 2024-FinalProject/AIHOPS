import React from 'react';
import aihops_article from "../assets/AIHOPS.pdf";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-card">
        <div className="about-header">
          <h1 style={{marginTop: "-10px"}}>About AIHOPS</h1>
        </div>
        <div className="about-content">
          <p>
            AIHOPS (Adoption of Innovation by Healthcare Organizations Prerequisites Scale) 
            is a comprehensive evaluation system designed to assess the readiness of healthcare 
            organizations to adopt innovations.
          </p>
          
          <p className="about-subtitle">The scale evaluates eight key factors:</p>
          
          <ul className="about-list">
            <li>Innovation Availability</li>
            <li>Organizational Attention</li>
            <li>Implementation Timeline Likelihood</li>
            <li>Stakeholder Support</li>
            <li>Financial Feasibility</li>
            <li>Training Requirements</li>
            <li>Workflow Impact</li>
            <li>Regulatory and Ethical Compliance</li>
          </ul>

          <div className="about-footer">
            <h2>Full Documentation</h2>
            <p>For detailed information about the AIHOPS methodology and scoring system, check out our complete documentation:</p>
            <a 
              href={aihops_article}
              target="_blank"
              rel="noopener noreferrer"
              className="about-button"
            >
              View AIHOPS Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
