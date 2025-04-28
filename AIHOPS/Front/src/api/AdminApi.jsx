import axios from "axios";
import { startSession } from "../api/AuthApi";
const API_URL = "http://localhost:5555";

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
  return cookie;
};

export const loginAdmin = async () => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/login`, {
    cookie: cookie,
    userName: "admin",
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

// export const addDefaultFactor = async (
//   cookie,
//   name,
//   desc,
//   scales_desc,
//   scales_explenation
// ) => {
//   return await axios.post(`${API_URL}/admin/add-default-factor`, {
//     cookie: cookie,
//     name: name,
//     desc: desc,
//     scales_desc: scales_desc,
//     scales_explenation: scales_explenation,
//   });
// };

export const removeDefaultFactor = async (fid) => {
  const cookie = await getMyCookie();
  return await axios.post(`${API_URL}/admin/remove-default-factor`, {
    cookie: cookie,
    fid: fid,
  });
};
