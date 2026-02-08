import { configureStore } from '@reduxjs/toolkit';
import moduleReducer from '../slices/moduleSlice';
import testResultReducer from '../slices/testResultSlice';
import authReducer from '../slices/authSlice';
import sectionReducer from '../slices/sectionSlice';
import contestReducer from '../slices/contestSlice';

const store = configureStore({
    reducer: {
        modules: moduleReducer,
        testResults: testResultReducer,
        auth: authReducer,
        sections: sectionReducer,
        contests: contestReducer,
    },
});

export default store;
