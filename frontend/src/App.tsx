import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { store } from './store';
import type { RootState } from './store';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';
import { login, logout } from './store/userSlice';
import { clearStoredToken, getStoredToken, meRequest } from './lib/auth';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Rent from './pages/Rent';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Availability from './pages/Availability';
import ChatPage from './pages/Chat';
import Header from './components/Header';
import Footer from './components/Footer';
import InteractiveAssistant from './components/InteractiveAssistant';
import CustomCursor from './components/CustomCursor';

// Inner layout that has access to Redux state
function Layout() {
  const isDark = useSelector((state: RootState) => state.theme.isDark);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const token = getStoredToken();

  const meQuery = useQuery({
    queryKey: ['me', token],
    queryFn: () => meRequest(token as string),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (!token) return;
    if (meQuery.isSuccess) {
      dispatch(login({ user: meQuery.data.user, token }));
    }
    if (meQuery.isError) {
      clearStoredToken();
      dispatch(logout());
    }
  }, [dispatch, meQuery.data, meQuery.isError, meQuery.isSuccess, token]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-100 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/rent" element={<Rent />} />
            <Route path="/rent/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <InteractiveAssistant />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <CustomCursor />
      <Router>
        <Layout />
      </Router>
    </Provider>
  );
}

export default App;
