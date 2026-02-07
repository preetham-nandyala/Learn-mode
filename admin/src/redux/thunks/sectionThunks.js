import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchSections = createAsyncThunk('sections/fetchSections', async () => {
    const response = await api.get('/sections');
    return response.data;
});

export const createSection = createAsyncThunk('sections/createSection', async (sectionData) => {
    const response = await api.post('/sections', sectionData);
    return response.data;
});

export const updateSection = createAsyncThunk('sections/updateSection', async ({ id, ...data }) => {
    const response = await api.put(`/sections/${id}`, data);
    return response.data;
});

export const deleteSection = createAsyncThunk('sections/deleteSection', async (id) => {
    await api.delete(`/sections/${id}`);
    return id;
});

export const migrateModules = createAsyncThunk('sections/migrateModules', async ({ oldSection, newSection }) => {
    const response = await api.put('/modules/sections/migrate', { oldSection, newSection });
    return response.data;
});
