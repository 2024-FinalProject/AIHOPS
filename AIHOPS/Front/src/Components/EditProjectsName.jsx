import React, { useState, useEffect } from "react";
import { getProjects, publishProject, setProjectFactors,
         setSeverityFactors, update_project_name_and_desc, addMembers, removeMember,
         get_pending_requests_for_project } from "../api/ProjectApi";
import { useNavigate } from "react-router-dom";
import "./ProjectsManagement.css";

