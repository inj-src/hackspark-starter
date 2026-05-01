import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const Products: React.FC = () => (
  <PageTransition>
    <section className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <span className="text-4xl">🛍️</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Browse Products</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md">
          The full product listing page is coming soon. Head back home to explore available rentals.
        </p>
        <Link
          to="/"
          className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-lg"
        >
          ← Back to Home
        </Link>
      </motion.div>
    </section>
  </PageTransition>
);

export default Products;
