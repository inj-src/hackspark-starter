import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Laptop, Car, Wrench, Music, Camera, Tent, BookOpen, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';

const categories = [
  { id: 'ELECTRONICS', name: 'Electronics', icon: Laptop },
  { id: 'BIKES', name: 'Bikes', icon: Car },
  { id: 'GARDEN', name: 'Garden', icon: Wrench },
  { id: 'MUSICAL_INSTRUMENTS', name: 'Music', icon: Music },
  { id: 'CAMERAS', name: 'Cameras', icon: Camera },
  { id: 'SPORTS', name: 'Sports', icon: Tent },
  { id: 'BOOKS', name: 'Books', icon: BookOpen },
  { id: 'TOYS', name: 'Toys', icon: Tv },
];

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    const query = searchText.trim();
    if (!query) {
      navigate('/rent');
      return;
    }
    navigate(`/rent?search=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    const update = () => {
      if (carouselRef.current) {
        setCarouselWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <PageTransition>
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-white dark:bg-slate-900 transition-colors duration-300">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/40 to-emerald-300/40 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Own Less,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
              Access More
            </span>
          </motion.h1>

          <motion.p
            className="mt-4 max-w-2xl text-xl text-gray-600 dark:text-slate-400 mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Rent, Barter, and Share items in your community. Earn credits by lending your items or pay with cash.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="relative flex items-center w-full h-16 rounded-full focus-within:shadow-lg bg-white dark:bg-slate-800 overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm transition-shadow">
              <div className="grid place-items-center h-full w-16 text-gray-400 dark:text-slate-500">
                <Search className="h-6 w-6" />
              </div>
              <input
                className="peer h-full w-full outline-none text-gray-700 dark:text-slate-200 dark:bg-slate-800 pr-2 text-lg placeholder-gray-400 dark:placeholder-slate-500"
                type="text"
                id="search"
                placeholder="What do you need to rent today?"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-12 px-6 m-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors"
                onClick={handleSearch}
              >
                Search
              </motion.button>
            </div>
          </motion.div>

          {/* Categories Carousel */}
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-6 text-left ml-2">
              Browse Categories
            </p>
            <motion.div
              ref={carouselRef}
              className="cursor-grab overflow-hidden flex"
              whileTap={{ cursor: 'grabbing' }}
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
                      role="button"
                      tabIndex={0}
                      className="min-w-[120px] h-[120px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3 transition-colors hover:border-green-500/50 dark:hover:border-green-500/50"
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/rent?category=${encodeURIComponent(cat.id)}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/rent?category=${encodeURIComponent(cat.id)}`);
                        }
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-500">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-slate-300 text-sm">{cat.name}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Hero;
