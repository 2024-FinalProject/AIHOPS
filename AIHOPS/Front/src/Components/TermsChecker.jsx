// // TermsChecker.jsx
// import { useEffect } from "react";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:5000", {
//   transports: ["websocket"],
//   withCredentials: true,
// });

// function TermsChecker({ userVersion, onUserMustAccept }) {
//   useEffect(() => {
//     const handleTerms = ({ version, tac_text }) => {
//       if (userVersion < version) {
//         onUserMustAccept(version, tac_text);
//       }
//     };

//     socket.on("get_terms", handleTerms);
//     socket.on("terms_updated", handleTerms);

//     // Trigger check when mounted
//     socket.emit("request_terms");

//     return () => {
//       socket.off("get_terms", handleTerms);
//       socket.off("terms_updated", handleTerms);
//     };
//   }, [userVersion]);

//   return null;
// }

// export default TermsChecker;
