import { createSlice } from '@reduxjs/toolkit';
import { fetchSections } from '../thunks/sectionThunks';

const sectionSlice = createSlice({
    name: 'sections',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSections.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSections.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchSections.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export default sectionSlice.reducer;
