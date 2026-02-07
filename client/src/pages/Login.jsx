import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/thunks/authThunks';
import AuthLayout from '../components/AuthLayout';
import Spinner from '../components/Spinner';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState(''); // Local error state for form

    // Redux State
    const { loading: isLoading, error: authError } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        try {
            await dispatch(loginUser({ email, password })).unwrap();
            navigate('/home');
        } catch (err) {
            setLocalError(err || 'Login failed');
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue your learning journey"
            error={localError || authError}
            footerText="Don't have an account?"
            footerLinkText="Create Account"
            footerLinkTo="/register"
        >
            <form onSubmit={handleSubmit} className="auth-layout__form">
                <div className="auth-layout__field">
                    <label className="auth-layout__label">Email</label>
                    <input
                        type="email"
                        className="auth-layout__input"
                        placeholder="you@example.com"
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
                    ) : (
                        <>
                            Sign In
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
};

export default Login;
