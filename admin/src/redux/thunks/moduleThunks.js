import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

// Fetch all modules
export const fetchModules = createAsyncThunk('modules/fetchModules', async () => {
    const response = await api.get('/modules');
    return response.data;
});

// Fetch single module by ID
export const fetchModuleById = createAsyncThunk('modules/fetchModuleById', async (id) => {
    const response = await api.get(`/modules/${id}`);
    return response.data;
});

// Create a new module
export const createModule = createAsyncThunk('modules/createModule', async (moduleData) => {
    const response = await api.post('/modules', moduleData);
    return response.data;
});

// Update an existing module
export const updateModule = createAsyncThunk('modules/updateModule', async ({ id, ...data }) => {
    const response = await api.put(`/modules/${id}`, data);
    return response.data;
});

// Delete a module
export const deleteModule = createAsyncThunk('modules/deleteModule', async (id) => {
    await api.delete(`/modules/${id}`);
    return id;
});

// Add a question
export const addQuestion = createAsyncThunk('modules/addQuestion', async ({ moduleId, questionData }) => {
    const response = await api.post(`/modules/${moduleId}/questions`, questionData);
    return response.data;
});

// Update a question
export const updateQuestion = createAsyncThunk('modules/updateQuestion', async ({ moduleId, questionId, questionData }) => {
    const response = await api.put(`/modules/${moduleId}/questions/${questionId}`, questionData);
    return response.data;
});

// Delete a question
export const deleteQuestion = createAsyncThunk('modules/deleteQuestion', async ({ moduleId, questionId }) => {
    await api.delete(`/modules/${moduleId}/questions/${questionId}`);
    return questionId;
});

// Bulk add questions
export const bulkAddQuestions = createAsyncThunk('modules/bulkAddQuestions', async ({ moduleId, questions }) => {
    const response = await api.post(`/modules/${moduleId}/questions/bulk`, { questions });
    return response.data;
});
