import React, { useEffect } from "react";
import {
  getProjectProgress,
  getProjectFactors,
  getProjectSeverityFactors,
  getProjectFactorVotes,
} from "../api/ProjectApi";

const getProjectsInfo = ({
  setProjectFactors,
  setProjectSeverityFactors,
  setProjectsProgress,
  setProjectFactorsVotes,
  setIsLoading,
}) => {
  const fetch_project_progress = async () => {
    try {
      let res = await getProjectProgress(projectId);
      if (res.data.success) setProjectsProgress(res.data.progress);
    } catch (error) {
      alert(error);
    }
  };

  const fetch_project_factors = async () => {
    try {
      let res = await getProjectFactors(projectId);
      if (res.data.success) {
        setProjectFactors(res.data.factors);
      }
    } catch (error) {
      alert(error);
    }
  };

  const fetch_project_severity_factors = async () => {
    try {
      let res = await getProjectSeverityFactors(projectId);
      if (res.data.success) setProjectSeverityFactors(res.data.severityFactors);
    } catch (error) {
      alert(error);
    }
  };

  const fetch_project_factors_votes = async () => {
    try {
      let res = await getProjectFactorVotes(projectId);
      if (res.data.success) setProjectFactorsVotes(res.data.votes);
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await fetch_project_factors();
      await fetch_project_progress();
      await fetch_project_factors_votes();
      await fetch_project_severity_factors();
      setIsLoading(false);
    };

    fetchAll();
  }, []);
};

export default getProjectsInfo;
