import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    imageUrl: 'https://images.unsplash.com/photo-1504280390227-8a6dc509a244?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'outdoors',
    lenderId: 'user3'
  },
  {
    id: '4',
    title: 'Nintendo Switch OLED',
    description: 'Comes with 4 joy-cons and Mario Kart 8.',
    pricePerDay: 25,
    imageUrl: 'https://images.unsplash.com/photo-1617396900799-f4c924bd4788?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'entertainment',
    lenderId: 'user4'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

const ProductGrid: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Recent Listings</h2>
            <p className="text-gray-600">Freshly added items in your area</p>
          </div>
          <button className="hidden sm:block text-rentpi-green font-medium hover:text-green-700 transition-colors">
            View All →
          </button>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {mockProducts.map((product) => (
            <motion.div 
              key={product.id} 
              variants={itemVariants}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col group"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img 
                  src={product.imageUrl} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-slate-900 shadow-sm text-sm">
                  ${product.pricePerDay}<span className="text-gray-500 text-xs font-normal">/day</span>
                </div>
                <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs uppercase tracking-wider font-medium">
                  {product.category}
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg text-slate-900 mb-1 line-clamp-1">{product.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                
                <button 
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="w-full bg-rentpi-green/10 text-rentpi-green hover:bg-rentpi-green hover:text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <button className="w-full mt-8 sm:hidden bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          View All Listings
        </button>
      </div>
    </section>
  );
};

export default ProductGrid;
