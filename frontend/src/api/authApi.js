import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000/api";

// ✅ Register a new user
export const registerUser = async (userData) => {
  return await axios.post(`${API_BASE_URL}/register`, userData);
};

// ✅ Login user and get JWT token
export const loginUser = async (loginData) => {
  return await axios.post(`${API_BASE_URL}/login`, loginData);
};

export const createWorkflow = async (workflow) => {
  console.log( workflow );
  return await axios.post(`${API_BASE_URL}/workflows`, workflow);
};

export const getWorkflows = async () => {
  return await axios.get(`${API_BASE_URL}/workflows`);
};

// Delete a workflow
export const deleteWorkflow = async (workflowId) => {
  return await axios.delete(`${API_BASE_URL}/workflows/${workflowId}`);
};

export const getQuestions = async () => {
  return await axios.get(`${API_BASE_URL}/instructor/questions`);
};

export const submitWorkflow = async (workflow) => {
  return await axios.post(`${API_BASE_URL}/student/submit_workflow`, workflow);
};

export const postQuestion = async (questionData) => {
  try {
    console.log(questionData);
    // Sending POST request to the backend to create a new question
    const response = await axios.post(`${API_BASE_URL}/instructor/questions`, questionData);
    return response.data; // Returning the response from the server
  } catch (error) {
    console.error("Error posting question:", error);
    throw error; // Rethrow the error if you need to handle it elsewhere
  }
};

