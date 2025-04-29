import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.jsx";
import { SeverityMetadataProvider } from "./context/SeverityMetadataContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <SeverityMetadataProvider>
        <App />
      </SeverityMetadataProvider>
    </Router>
  </StrictMode>
);
