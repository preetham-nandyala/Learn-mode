import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

// Check if interceptor uses 'userToken' key
const TOKEN_KEY = 'userToken';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const response = await api.post('/auth/login', credentials);
        // Response usually { _id, name, email, token, isAdmin }
        if (response.data.token) {
            localStorage.setItem(TOKEN_KEY, response.data.token);
            // Also store user info if needed
            localStorage.setItem('userInfo', JSON.stringify({
                _id: response.data._id,
                name: response.data.name,
                email: response.data.email,
                isAdmin: response.data.isAdmin
            }));
        }
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem(TOKEN_KEY, response.data.token);
            localStorage.setItem('userInfo', JSON.stringify({
                _id: response.data._id,
                name: response.data.name,
                email: response.data.email,
                isAdmin: response.data.isAdmin
            }));
        }
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
});
