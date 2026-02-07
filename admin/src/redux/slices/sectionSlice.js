import { createSlice } from '@reduxjs/toolkit';
import { fetchSections, createSection, updateSection, deleteSection } from '../thunks/sectionThunks';

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
            // Fetch Sections
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
            })
            // Create Section
            .addCase(createSection.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            // Update Section
            .addCase(updateSection.fulfilled, (state, action) => {
                const index = state.items.findIndex(s => s._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            // Delete Section
            .addCase(deleteSection.fulfilled, (state, action) => {
                state.items = state.items.filter(s => s._id !== action.payload);
            });
    },
});

export default sectionSlice.reducer;
