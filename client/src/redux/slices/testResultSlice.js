import { createSlice } from '@reduxjs/toolkit';
import { fetchTestHistory, submitTestResult } from '../thunks/testResultThunks';

const testResultSlice = createSlice({
    name: 'testResults',
    initialState: {
        history: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch History
            .addCase(fetchTestHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTestHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchTestHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Submit Test
            .addCase(submitTestResult.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitTestResult.fulfilled, (state, action) => {
                state.loading = false;
                // Optimistic update: add to history if payload resembles history item
                // But backend structure might differ (populated vs not). 
                // Safer to just let next history fetch get it, or push if structure matches.
                // We'll push it.
                if (action.payload) state.history.unshift(action.payload);
            })
            .addCase(submitTestResult.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export default testResultSlice.reducer;
