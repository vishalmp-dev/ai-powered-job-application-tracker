import axios from "axios";

const API = "http://localhost:5000/api/applications";

const getToken = () => localStorage.getItem("token");

export const getApplications = () =>
  axios.get(API, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

export const createApplication = (data: any) =>
  axios.post(API, data, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

export const updateApplication = (id: string, data: any) =>
  axios.put(`${API}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  export const deleteApplication = (id: string) =>
  axios.delete(`${API}/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });