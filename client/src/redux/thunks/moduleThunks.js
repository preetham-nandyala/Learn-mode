import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchModules = createAsyncThunk('modules/fetchModules', async () => {
    const response = await api.get('/modules');
    return response.data;
});

export const fetchModuleById = createAsyncThunk('modules/fetchModuleById', async (id) => {
    const response = await api.get(`/modules/${id}`);
    return response.data;
});
