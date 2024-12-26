import React, {useEffect} from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Importing the components


// Importing the pages
import WelcomePage from "./pages/WelcomePage";

const AppContent = () => {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    // Fetch session cookie from the /enter endpoint
    axios.get("/enter").then((response) => {
      if (response.data.isAuthenticated) {
        const sessionCookie = response.data.sessionCookie;
        login();
      }
    })
    .catch (error => {
      console.error("Error fetching session cookie: ", error);
    });
  }, [login]);

  return (
    // <div className="App">
    //   <header className="App-header">
    //     <h1>AIHOPS</h1>
    //   </header>
    //   <Main />
    // </div>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
      </Routes>


  );
}

const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

export default App;




