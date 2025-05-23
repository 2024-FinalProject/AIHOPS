import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  ButtonGroup,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import FactorManagement from "../Components/AdminComponents/factors/FactorManagement";
import SeverityFactorsView from "../Components/AdminComponents/SeverityFactors/SeverityFactorsView";
import ErrorDisplay from "../Components/MessagesDisplay/ErrorDisplay";
import { useError } from "../context/ErrorContext";
import { useAuth } from "../context/AuthContext";
import ProjectsManager from "../Components/AdminComponents/Projects/ProjectsManager";
import EditTAC from "../Components/AdminComponents/EditTAC";
import EditAbout from "../Components/AdminComponents/EditAbout";


const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isValidatingToken } = useAuth();
  const { errorMsg, setErrorMsg } = useError();

  const [isManagingFactors, setIsManagingFactors] = useState(false);
  const [isManagingSeverityFactors, setIsManagingSeverityFactors] =
    useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [editTAC, setEditTAC] = useState(false);
  const [editAbout, setEditAbout] = useState(false);


  const handleManageDefaultAssessmentDims = () => {
    setIsManagingFactors(true);
    setIsManagingSeverityFactors(false);
    setShowResearch(false);
    setEditTAC(false);
    setEditAbout(false);
  };

  const handleManageDefaultSeverityFactors = () => {
    setIsManagingFactors(false);
    setIsManagingSeverityFactors(true);
    setShowResearch(false);
    setEditTAC(false);
    setEditAbout(false);
  };

  const handleResearch = () => {
    setShowResearch(true);
    setIsManagingFactors(false);
    setIsManagingSeverityFactors(false);
    setEditTAC(false);
    setEditAbout(false);
  };

  const handleEditTAC = () => {
    setEditTAC(true);
    setShowResearch(false);
    setIsManagingFactors(false);
    setIsManagingSeverityFactors(false);
    setEditAbout(false);
  };

  const handleEditAbout = () => {
    setEditAbout(true);
    setEditTAC(false);
    setShowResearch(false);
    setIsManagingFactors(false);
    setIsManagingSeverityFactors(false);
  }


  useEffect(() => {
    if (!isValidatingToken) {
      if (!isAdmin) {
        setErrorMsg("You are not authorized to view this page.");
        navigate("/");
      }
    }
  }, [isValidatingToken]);

  return (
    <Container className="py-5">
      <Card className="shadow-lg border-0 px-4 py-4">
        <Card.Body>
          <h2 className="text-center fw-bold text-primary mb-4">
            Admin Control Panel
          </h2>

          {errorMsg ? (
            <ErrorDisplay message={errorMsg} onClose={setErrorMsg("")} />
          ) : (
            <Row className="justify-content-center mb-4">
              <Col xs="auto">
                <div className="d-flex flex-row flex-wrap justify-content-center">
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="px-4 py-2 rounded-3 shadow-sm me-3 mb-2"
                    onClick={handleManageDefaultAssessmentDims}
                  >
                    📊 Assessment Dimensions
                  </Button>

                  <Button
                    variant="outline-info"
                    size="lg"
                    className="px-4 py-2 rounded-3 shadow-sm me-3 mb-2"
                    onClick={handleManageDefaultSeverityFactors}
                  >
                    ⚠️ Severity Factors
                  </Button>

                  <Button
                    variant="outline-success"
                    size="lg"
                    className="px-4 py-2 rounded-3 shadow-sm mb-2"
                    onClick={handleResearch}
                  >
                    🔍 Research
                  </Button>
                  <Button
                    variant="outline-success"
                    size="lg"
                    className="px-4 py-2 rounded-3 shadow-sm mb-2"
                    onClick={handleEditTAC}
                  >
                    Edit Terms & Conditions
                  </Button>

                  <Button
                    variant="outline-success"
                    size="lg"
                    className="px-4 py-2 rounded-3 shadow-sm mb-2"
                    onClick={handleEditAbout}
                    >
                      Edit About
                    </Button>
                </div>
              </Col>
            </Row>
          )}
          <Row>
            <Col>
              {isManagingFactors && <FactorManagement />}
              {isManagingSeverityFactors && <SeverityFactorsView />}
              {showResearch && <ProjectsManager />}
              {editTAC && <EditTAC />}
              {editAbout && <EditAbout />}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminPage;
