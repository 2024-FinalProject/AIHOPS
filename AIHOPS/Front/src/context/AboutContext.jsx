import React, { createContext, useState, useContext, useEffect } from "react";
import { fetchAbout } from "../api/AdminApi";



const AboutContext = createContext();


export const AboutProvider = ({ children }) => {
    const [aboutText, setAboutText] = useState(" ");

    useEffect(() => {
        const fetchAboutContent = async () => {
            const response = await fetchAbout();
            if (response.data.success) {
                setAboutText(response.data.about_text);
            } else {
                console.error("Failed to fetch about text");
            }
        }
        fetchAboutContent();

        
    }
    , []);
    return (
        <AboutContext.Provider value={{ aboutText }}>
            {children}
        </AboutContext.Provider>
    );

};

export const useAbout = () =>  useContext(AboutContext);

// export { updateAbout };