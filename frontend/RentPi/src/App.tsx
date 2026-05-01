import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { store } from './store';
import type { RootState } from './store';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/Header';
import Footer from './components/Footer';
import InteractiveAssistant from './components/InteractiveAssistant';
import CustomCursor from './components/CustomCursor';

// Inner layout that has access to Redux state
function Layout() {
  const isDark = useSelector((state: RootState) => state.theme.isDark);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-100 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
