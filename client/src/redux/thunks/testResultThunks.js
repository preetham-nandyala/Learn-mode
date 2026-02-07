import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchTestHistory = createAsyncThunk('testResults/fetchHistory', async () => {
    const response = await api.get('/test-results/history');
    return response.data;
});

export const submitTestResult = createAsyncThunk('testResults/submit', async (resultData) => {
    const response = await api.post('/test-results', resultData);
    return response.data;
});
