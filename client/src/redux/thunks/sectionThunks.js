import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchSections = createAsyncThunk('sections/fetchSections', async () => {
    const response = await api.get('/sections');
    return response.data;
});
