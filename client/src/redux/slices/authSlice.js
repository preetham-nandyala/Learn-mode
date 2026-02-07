import { createSlice } from '@reduxjs/toolkit';
import { loginUser, registerUser } from '../thunks/authThunks';

const userInfoFromStorage = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

const tokenFromStorage = localStorage.getItem('userToken') || null;

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: userInfoFromStorage,
        token: tokenFromStorage,
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
            localStorage.removeItem('userInfo');
            localStorage.removeItem('userToken');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = {
                    _id: action.payload._id,
                    name: action.payload.name,
                    email: action.payload.email,
                    isAdmin: action.payload.isAdmin
                };
                state.token = action.payload.token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = {
                    _id: action.payload._id,
                    name: action.payload.name,
                    email: action.payload.email,
                    isAdmin: action.payload.isAdmin
                };
                state.token = action.payload.token;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
