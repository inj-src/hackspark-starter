import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Laptop, Car, Wrench, Music, Camera, Tent, BookOpen, Tv } from 'lucide-react';

const categories = [
  { id: 'electronics', name: 'Electronics', icon: Laptop },
  { id: 'vehicles', name: 'Vehicles', icon: Car },
  { id: 'tools', name: 'Tools', icon: Wrench },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'photography', name: 'Cameras', icon: Camera },
  { id: 'outdoors', name: 'Outdoors', icon: Tent },
  { id: 'books', name: 'Books', icon: BookOpen },
  { id: 'entertainment', name: 'Entertainment', icon: Tv },
];

const Hero: React.FC = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      setCarouselWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
    // Update width on resize
    const handleResize = () => {
      if (carouselRef.current) {
        setCarouselWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-rentpi-green/40 to-emerald-300/40 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.h1 
          className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Own Less, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentpi-green to-emerald-500">Access More</span>
        </motion.h1>
        
        <motion.p 
          className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Rent, Barter, and Share items in your community. Earn credits by lending your items or pay with cash.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button className="w-full sm:w-auto bg-rentpi-green hover:bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Find Items to Rent
          </button>
          <button className="w-full sm:w-auto bg-white border-2 border-rentpi-green text-rentpi-green hover:bg-green-50 px-8 py-4 rounded-full font-semibold text-lg transition-all">
            List Your Items
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative flex items-center w-full h-16 rounded-full focus-within:shadow-lg bg-white overflow-hidden border border-gray-200 shadow-sm transition-shadow">
            <div className="grid place-items-center h-full w-16 text-gray-400">
              <Search className="h-6 w-6" />
            </div>
            <input
              className="peer h-full w-full outline-none text-gray-700 pr-2 text-lg"
              type="text"
              id="search"
              placeholder="What do you need to rent today?" 
            />
            <button className="h-12 px-6 m-2 bg-rentpi-green hover:bg-green-600 text-white rounded-full font-medium transition-colors">
              Search
            </button>
          </div>
        </motion.div>

        {/* Categories Carousel */}
        <motion.div 
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6 text-left ml-2">Browse Categories</p>
          <motion.div 
            ref={carouselRef} 
            className="cursor-grab overflow-hidden flex"
            whileTap={{ cursor: "grabbing" }}
          >
            <motion.div 
              drag="x" 
              dragConstraints={{ right: 0, left: -carouselWidth }}
              className="flex gap-4 sm:gap-6 py-4 px-2"
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    className="min-w-[120px] h-[120px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 transition-colors hover:border-rentpi-green/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-rentpi-green">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-gray-700">{cat.name}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
