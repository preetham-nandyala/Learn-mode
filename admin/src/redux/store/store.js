import { configureStore } from '@reduxjs/toolkit';
import moduleReducer from '../slices/moduleSlice';
import sectionReducer from '../slices/sectionSlice';
import authReducer from '../slices/authSlice';

const store = configureStore({
    reducer: {
        modules: moduleReducer,
        sections: sectionReducer,
        auth: authReducer,
    },
});

export default store;
