import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const loginAdmin = createAsyncThunk('auth/loginAdmin', async ({ email, password }, { rejectWithValue }) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.role !== 'admin') {
            return rejectWithValue('Not authorized as admin');
        }
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
});
