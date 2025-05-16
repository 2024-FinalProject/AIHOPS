import axios from "axios";
import { startSession } from "../api/AuthApi";
import { API_URL } from "../constants";

const getMyCookie = async () => {
  const existingToken = localStorage.getItem("authToken");
  let cookie;
  if (existingToken) {
    cookie = existingToken;
  } else {
    const session = await startSession();
    cookie = session.data.cookie;
    localStorage.setItem("authToken", cookie);
    localStorage.setItem("userName", "admin");
  }
  console.log("cookie: ", cookie);
  return cookie;
};

export const loginAdmin = async () => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/login`, {
    cookie: cookie,
    userName: "admin@admin.com",
    passwd: "admin",
  });
};

export const fetchDefaultFactors = async () => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/fetch-default-factors`, {
    cookie: cookie,
  });
};

export const updateDefaultFactor = async (
  fid,
  name,
  desc,
  scales_desc,
  scales_explenation
) => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/update-default-factor`, {
    cookie: cookie,
    fid: fid,
    name: name,
    desc: desc,
    scales_desc: scales_desc,
    scales_explenation: scales_explenation,
  });
};

export const addDefaultFactor = async (
  name,
  desc,
  scales_desc,
  scales_explenation
) => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/add-default-factor`, {
    cookie: cookie,
    name: name,
    desc: desc,
    scales_desc: scales_desc,
    scales_explenation: scales_explenation,
  });
};

export const removeDefaultFactor = async (fid) => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/remove-default-factor`, {
    cookie: cookie,
    fid: fid,
  });
};

export const fetchDefaultSeverityFactors = async () => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/fetch-default-severity-factors`, {
    cookie: cookie,
  });
};

export const updateDefaultSeverityFactor = async (severityFactors) => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/update-default-severity-factors`, {
    cookie: cookie,
    severity_factors: severityFactors,
  });
};

export const fetchResearchProjects = async () => {
  const cookie = await getMyCookie();
  return await axios.get(`${API_URL}/get-research-projects`, {
    params: { cookie: cookie },
  });
};

export const removeResearchProject = async (pid) => {
  const cookie = await getMyCookie();
  return await axios.get(`${API_URL}/remove-research-project`, {
    params: { cookie: cookie, pid: pid },
  });
};

export const updateTermsAndConditions = async (updatedTXT) => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/update-terms-and-conditions`, {
    cookie: cookie,
    updatedTXT: updatedTXT,
  });
};

export const updateAbout = async  (updatedTXT) => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/update-about`, {
    cookie: cookie,
    updatedTXT: updatedTXT,
  });
}

export const fetchAbout = async () => {
  const cookie = await getMyCookie();
  return await axios.get(`${API_URL}/admin/fetch-about`, {
    params: { cookie: cookie },
  });
}

  
