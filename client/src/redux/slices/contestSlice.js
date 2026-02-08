import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchContestSections = createAsyncThunk('contests/fetchSections', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/contests/sections');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch contest sections');
    }
});

export const fetchContests = createAsyncThunk('contests/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/contests');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch contests');
    }
});

export const fetchContestById = createAsyncThunk('contests/fetchById', async (id, { rejectWithValue }) => {
    try {
        const response = await api.get(`/contests/${id}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch contest details');
    }
});

const initialState = {
    items: [],
    sections: [],
    currentContest: null,
    loading: false,
    error: null
};

const contestSlice = createSlice({
    name: 'contests',
    initialState,
    reducers: {
        clearCurrentContest: (state) => {
            state.currentContest = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchContests.pending, (state) => { state.loading = true; })
            .addCase(fetchContests.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchContests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchContestSections.fulfilled, (state, action) => {
                state.sections = action.payload;
            })
            .addCase(fetchContestById.fulfilled, (state, action) => {
                state.currentContest = action.payload;
            });
    }
});

export const { clearCurrentContest } = contestSlice.actions;
export default contestSlice.reducer;
