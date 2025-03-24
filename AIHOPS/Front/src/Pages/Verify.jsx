import {useNavigate} from "react-router-dom";
import React, {useState} from "react";
import {verify, startSession} from "../api/AuthApi.jsx";


const Verify = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // null means no message initially
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();

    // Reset state before making the request
    setMsg("");
    setIsSuccess(null);  // Reset before starting the registration attempt

    try {
      const existingToken = localStorage.getItem("authToken");
      let cookie;
      if(existingToken) {
          cookie = existingToken;
      }
      else{
          const session = await startSession();
          cookie = session.data.cookie;
      }
      const response = await verify(cookie, userName, password, code);

      // Check if registration is successful
      if (response.data.success) {
        setMsg(response.data.message);
        setIsSuccess(true);
        //navigate("/login");
      } else {
        setMsg(response.data.message);
        setIsSuccess(false);
      }

    } catch (error) {
      setMsg("Failed to validate");
      setIsSuccess(false);
    }
  };


  return (
      <div className="register-container">
        <div className="register-card">
          <form onSubmit={handleVerify}>
            <div className="register-form-group">
              <input
                  type="text"
                  id="formUsername"
                  placeholder="Enter username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
              />
            </div>

            <div className="register-form-group">
              <input
                  type="password"
                  id="formPassword"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
              />
            </div>

            <div className="register-form-group">
              <input
                  type="text"
                  id="formCode"
                  placeholder="Enter Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
              />
            </div>

            <button type="submit" className="register-submit-btn">
              Verify
            </button>
          </form>

          {/* Display Success or Failure Message */}
          {msg && (
              <div className={`register-alert ${isSuccess === true ? "success" : isSuccess === false ? "danger" : ""}`}>
                {msg}
              </div>
          )}
        </div>
      </div>
  );
}

export default Verify;
