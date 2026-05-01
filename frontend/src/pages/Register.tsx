import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { login } from '../store/userSlice';
import { registerRequest, setStoredToken } from '../lib/auth';
import PageTransition from '../components/PageTransition';

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: ({ token, user }) => {
      setStoredToken(token);
      dispatch(login({ user, token }));
      navigate('/products');
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('Name, email and password are required.');
      return;
    }

    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
    });
  };

  const apiError = registerMutation.error instanceof Error ? registerMutation.error.message : null;

  return (
    <PageTransition>
      <section className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-16">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-6">Create your RentPi account</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
            />
            {(formError || apiError) && <p className="text-sm text-red-600">{formError ?? apiError}</p>}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account? <Link to="/login" className="text-green-500 hover:underline">Sign in</Link>
          </p>
        </div>
      </section>
    </PageTransition>
  );
};

export default Register;
