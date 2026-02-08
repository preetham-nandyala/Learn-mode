import { createSlice } from '@reduxjs/toolkit';
import { fetchModules, fetchModuleById, fetchTestQuestions } from '../thunks/moduleThunks';

const moduleSlice = createSlice({
    name: 'modules',
    initialState: {
        items: [],
        currentModule: null,
        testQuestions: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // ... (keep previous cases)
            .addCase(fetchModules.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchModules.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchModules.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch By ID
            .addCase(fetchModuleById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentModule = null; // Clear previous
            })
            .addCase(fetchModuleById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentModule = action.payload;
            })
            .addCase(fetchModuleById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch Test Questions
            .addCase(fetchTestQuestions.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.testQuestions = []; // Clear previous questions
            })
            .addCase(fetchTestQuestions.fulfilled, (state, action) => {
                state.loading = false;
                state.testQuestions = action.payload;
            })
            .addCase(fetchTestQuestions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export default moduleSlice.reducer;
