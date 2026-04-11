import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

export const registerUser = (data: { email: string; password: string }) =>
  axios.post(`${API}/register`, data);

export const loginUser = (data: { email: string; password: string }) =>
  axios.post(`${API}/login`, data);