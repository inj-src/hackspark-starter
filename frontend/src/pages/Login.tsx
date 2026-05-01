import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { login } from '../store/userSlice';
import { loginRequest, setStoredToken } from '../lib/auth';
import PageTransition from '../components/PageTransition';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ token, user }) => {
      setStoredToken(token);
      dispatch(login({ user, token }));
      navigate('/rent');
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError('Email and password are required.');
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  const apiError = loginMutation.error instanceof Error ? loginMutation.error.message : null;

  return (
    <PageTransition>
      <section className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">R</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Sign in to your RentPi account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {(formError || apiError) && (
              <p className="text-sm text-red-600 dark:text-red-400">{formError ?? apiError}</p>
            )}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loginMutation.isPending}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-500 hover:underline font-medium">Sign up</Link>
          </p>
        </motion.div>
      </section>
    </PageTransition>
  );
};

export default Login;
