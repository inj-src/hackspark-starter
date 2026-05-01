import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/themeSlice';
import type { RootState } from '../store';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const isDark = useSelector((state: RootState) => state.theme.isDark);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-green-500 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">R</div>
              RentPi
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 font-medium transition-colors">Home</Link>
            <Link to="/products" className="text-gray-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 font-medium transition-colors">Rent</Link>
            <Link to="/products" className="text-gray-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 font-medium transition-colors">Buy</Link>
            <Link to="/" className="text-gray-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 font-medium transition-colors">Community</Link>
          </nav>

          {/* Auth Buttons + Theme Toggle */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <motion.button
              onClick={() => dispatch(toggleTheme())}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: 90, scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: -90, scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-600 dark:text-slate-300 hover:text-green-500 dark:hover:text-green-400 font-medium transition-colors px-3 py-2"
              >
                Login
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-medium transition-colors shadow-sm hover:shadow-md"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>

          {/* Mobile: Theme + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <motion.button
              onClick={() => dispatch(toggleTheme())}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div key="sun-m" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ duration: 0.2 }}>
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div key="moon-m" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }} transition={{ duration: 0.2 }}>
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 dark:text-slate-300 hover:text-green-500 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-800 dark:text-slate-200 hover:text-green-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md">Home</Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-800 dark:text-slate-200 hover:text-green-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md">Rent</Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-800 dark:text-slate-200 hover:text-green-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md">Buy</Link>
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-800 dark:text-slate-200 hover:text-green-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md">Community</Link>
              <div className="mt-3 flex flex-col gap-2 px-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center text-gray-600 dark:text-slate-300 hover:text-green-500 font-medium py-2 border border-gray-200 dark:border-slate-700 rounded-md">Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full text-center bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-medium">Sign Up</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
