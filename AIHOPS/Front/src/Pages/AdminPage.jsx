import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import FactorsView from "../Components/AdminComponents/factors/FactorsView";
import { loginAdmin } from "../api/AdminApi";
import FactorManagement from "../Components/AdminComponents/factors/FactorManagement";
import SeverityFactorsView from "../Components/AdminComponents/SeverityFactors/SeverityFactorsView";
import { useError } from "../context/ErrorContext";
import { useAuth } from "../context/AuthContext";
import ErrorDisplay from "../Components/MessagesDisplay/ErrorDisplay";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isValidatingToken } = useAuth();
  const { errorMsg, setErrorMsg } = useError();
  const [isManagingFactors, setIsManagingFactors] = useState(false);
  const [isManagingSeverityFactors, setIsManagingSeverityFactors] =
    useState(false);

  const handleManageDefaultAssessmentDims = () => {
    console.log("managing default assessment dims");
    setIsManagingFactors(true);
    setIsManagingSeverityFactors(false);
  };

  const handleManageDefaultSeverityFactors = () => {
    console.log("managing default severity factors");
    setIsManagingFactors(false);
    setIsManagingSeverityFactors(true);
  };

  useEffect(() => {
    if (!isValidatingToken) {
      if (!isAdmin) {
        setErrorMsg("You are not authorized to view this page.");
        navigate("/");
      }
    }
  }, [isAdmin, isValidatingToken]);

  return (
    <>
      <div>AdminPage</div>
      <ErrorDisplay message={errorMsg} onClose={() => setErrorMsg("")} />
      <div>
        <Button onClick={handleManageDefaultAssessmentDims}>
          Manage Default Assessment Dimenstions
        </Button>
        <Button onClick={handleManageDefaultSeverityFactors}>
          Manage Default severity factors
        </Button>
        <Button onClick={() => console.log("not impemented yet")}>
          research
        </Button>
        <Button onClick={() => console.log("not impemented yet")}>
          update terms and conditions
        </Button>
      </div>
      <div>
        {isManagingFactors && (
          <div>
            <FactorManagement />
          </div>
        )}
      </div>
      <div>
        {isManagingSeverityFactors && (
          <div>
            <SeverityFactorsView />
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPage;
