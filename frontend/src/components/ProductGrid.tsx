import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { Product } from '../types';

const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Sony Alpha a7 III Camera',
    description: 'Full-frame mirrorless camera, great for weddings and events. Lens included.',
    pricePerDay: 45,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'photography',
    lenderId: 'user1'
  },
  {
    id: '2',
    title: 'Makita Power Drill Set',
    description: '18V cordless drill/driver kit with 2 batteries and charger.',
    pricePerDay: 15,
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'tools',
    lenderId: 'user2'
  },
  {
    id: '3',
    title: 'Coleman 4-Person Tent',
    description: 'Spacious dome tent, sets up in 10 minutes. Waterproof.',
    pricePerDay: 20,
    imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=600&q=80',
    category: 'outdoors',
    lenderId: 'user3'
  },
  {
    id: '4',
    title: 'Nintendo Switch OLED',
    description: 'Comes with 4 joy-cons and Mario Kart 8.',
    pricePerDay: 25,
    imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=600&q=80',
    category: 'entertainment',
    lenderId: 'user4'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
};

const ProductGrid: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const displayProducts = React.useMemo(() => {
    if (!isAuthenticated || !currentUser) return mockProducts;
    return [...mockProducts]
      .sort((a, b) => {
        const aScore = (a.category.length + a.id.length + currentUser.id) % 7;
        const bScore = (b.category.length + b.id.length + currentUser.id) % 7;
        return bScore - aScore;
      })
      .slice(0, 4);
  }, [currentUser, isAuthenticated]);
  const sectionTitle = isAuthenticated ? 'Suggested for You' : 'Recent Listings';
  const sectionSubtitle = isAuthenticated
    ? 'Picked for your interests and nearby activity'
    : 'Freshly added items in your area';

  return (
    <section className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex justify-between items-end mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{sectionTitle}</h2>
            <p className="text-gray-600 dark:text-slate-400">{sectionSubtitle}</p>
          </div>
          <button className="hidden sm:block text-green-500 font-medium hover:text-green-700 dark:hover:text-green-400 transition-colors">
            View All →
          </button>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          {displayProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg dark:shadow-none dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow border border-gray-100 dark:border-slate-700 flex flex-col group"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-700">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  onError={(event) => {
                    event.currentTarget.src = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-slate-900 dark:text-slate-100 shadow-sm text-sm">
                  ${product.pricePerDay}<span className="text-gray-500 dark:text-slate-400 text-xs font-normal">/day</span>
                </div>
                <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs uppercase tracking-wider font-medium">
                  {product.category}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-1 line-clamp-1">{product.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>

                <motion.button
                  onClick={() => navigate(`/rent/${product.id}`)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white dark:hover:bg-green-500 dark:hover:text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  View Details
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <button className="w-full mt-8 sm:hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          View All Listings
        </button>
      </div>
    </section>
  );
};

export default ProductGrid;
