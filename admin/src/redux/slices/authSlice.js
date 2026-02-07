import { createSlice } from '@reduxjs/toolkit';
import { loginAdmin } from '../thunks/authThunks';

// Initial state from localStorage
const token = localStorage.getItem('adminToken');
const name = localStorage.getItem('adminName');

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token: token || null,
        name: name || null,
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.token = null;
            state.name = null;
            state.loading = false;
            state.error = null;
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminName');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.name = action.payload.name;
                localStorage.setItem('adminToken', action.payload.token);
                localStorage.setItem('adminName', action.payload.name);
            })
            .addCase(loginAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
