import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const Buy: React.FC = () => (
  <PageTransition>
    <section className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <span className="text-4xl">🛒</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Buy Items</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md">
          The buy marketplace page is coming soon. Browse rentals or head back home for now.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/rent"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg"
          >
            Browse Rentals
          </Link>
          <Link
            to="/"
            className="inline-block bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Back Home
          </Link>
        </div>
      </motion.div>
    </section>
  </PageTransition>
);

export default Buy;
