import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginAdmin } from '../redux/thunks/authThunks';
import { clearError as clearAuthError } from '../redux/slices/authSlice';
import AuthLayout from '../components/AuthLayout';
import Spinner from '../components/Spinner';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { loading: isLoading, error } = useSelector(state => state.auth);

    useEffect(() => {
        dispatch(clearAuthError());
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(loginAdmin({ email, password })).unwrap();
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AuthLayout
            title="Admin Portal"
            subtitle="Sign in to manage your platform"
            error={error}
            footerText="Protected admin area • Unauthorized access prohibited"
            logoText="AdminPanel"
        >
            <form onSubmit={handleSubmit} className="auth-layout__form">
                <div className="auth-layout__field">
                    <label className="auth-layout__label">Email Address</label>
                    <input
                        type="email"
                        className="auth-layout__input"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="auth-layout__field">
                    <label className="auth-layout__label">Password</label>
                    <input
                        type="password"
                        className="auth-layout__input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="auth-layout__submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Spinner size={16} />
                            Signing in...
                        </>
                    ) : 'Sign In'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default Login;
