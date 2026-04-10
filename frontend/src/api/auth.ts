import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const registerUser = (data: { email: string; password: string }) =>
  axios.post(`${API}/register`, data);

export const loginUser = (data: { email: string; password: string }) =>
  axios.post(`${API}/login`, data);