import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import FactorsView from "../Components/AdminComponents/FactorsView";
import { loginAdmin } from "../api/AdminApi";
import FactorManagement from "../Components/AdminComponents/FactorManagement";

const AdminPage = () => {
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
    loginAdmin();
  }, []);

  return (
    <>
      <div>AdminPage</div>
      <div>
        <Button onClick={handleManageDefaultAssessmentDims}>
          Manage Default Assessment Dimenstions
        </Button>
        <Button onClick={handleManageDefaultSeverityFactors}>
          Manage Default severity factors
        </Button>
      </div>
      {isManagingFactors && (
        <div>
          <FactorManagement />
        </div>
      )}
    </>
  );
};

export default AdminPage;
