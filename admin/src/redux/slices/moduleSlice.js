import { createSlice } from '@reduxjs/toolkit';
import {
    fetchModules, fetchModuleById, createModule, updateModule, deleteModule,
    addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions
} from '../thunks/moduleThunks';

const moduleSlice = createSlice({
    name: 'modules',
    initialState: {
        items: [],
        currentModule: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentModule: (state) => {
            state.currentModule = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Modules
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
            // Fetch Module By ID
            .addCase(fetchModuleById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentModule = null;
            })
            .addCase(fetchModuleById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentModule = action.payload;
            })
            .addCase(fetchModuleById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Create Module
            .addCase(createModule.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            // Update Module
            .addCase(updateModule.fulfilled, (state, action) => {
                const index = state.items.findIndex((m) => m._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                if (state.currentModule && state.currentModule._id === action.payload._id) {
                    // Merge with existing questions if update doesn't return them? 
                    // updateModule returns full module but likely without questions populated or maybe with?
                    // Controller `updateModule` returns `updatedModule` (Module doc). It does NOT populate questions.
                    // So we must preserve questions if we replace currentModule!
                    const questions = state.currentModule.questions;
                    state.currentModule = { ...action.payload, questions };
                }
            })
            // Delete Module
            .addCase(deleteModule.fulfilled, (state, action) => {
                state.items = state.items.filter((m) => m._id !== action.payload);
                if (state.currentModule && state.currentModule._id === action.payload) {
                    state.currentModule = null;
                }
            })
            // Add Question
            .addCase(addQuestion.fulfilled, (state, action) => {
                if (state.currentModule) {
                    if (!state.currentModule.questions) state.currentModule.questions = [];
                    state.currentModule.questions.push(action.payload);
                }
            })
            // Update Question
            .addCase(updateQuestion.fulfilled, (state, action) => {
                if (state.currentModule && state.currentModule.questions) {
                    const index = state.currentModule.questions.findIndex(q => q._id === action.payload._id);
                    if (index !== -1) {
                        state.currentModule.questions[index] = action.payload;
                    }
                }
            })
            // Delete Question
            .addCase(deleteQuestion.fulfilled, (state, action) => {
                if (state.currentModule && state.currentModule.questions) {
                    state.currentModule.questions = state.currentModule.questions.filter(q => q._id !== action.payload);
                }
            })
            // Bulk Add Questions
            .addCase(bulkAddQuestions.fulfilled, (state, action) => {
                if (state.currentModule) {
                    if (!state.currentModule.questions) state.currentModule.questions = [];
                    state.currentModule.questions.push(...action.payload);
                }
            });
    },
});

export const { clearCurrentModule } = moduleSlice.actions;
export default moduleSlice.reducer;
