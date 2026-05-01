import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-rentpi-green flex items-center gap-2">
              <div className="w-8 h-8 bg-rentpi-green rounded-lg flex items-center justify-center text-white font-bold">R</div>
              RentPi
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-rentpi-green font-medium transition-colors">Home</Link>
            <Link to="/" className="text-gray-600 hover:text-rentpi-green font-medium transition-colors">Rent</Link>
            <Link to="/" className="text-gray-600 hover:text-rentpi-green font-medium transition-colors">Buy</Link>
            <Link to="/" className="text-gray-600 hover:text-rentpi-green font-medium transition-colors">Community</Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-rentpi-green font-medium transition-colors">
              Login
            </button>
            <button className="bg-rentpi-green hover:bg-green-600 text-white px-5 py-2 rounded-full font-medium transition-colors shadow-sm hover:shadow-md">
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-rentpi-green focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full">
          <div className="px-4 pt-2 pb-4 space-y-1 sm:px-3 flex flex-col">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-800 hover:text-rentpi-green hover:bg-gray-50 rounded-md">Home</Link>
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-800 hover:text-rentpi-green hover:bg-gray-50 rounded-md">Rent</Link>
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-800 hover:text-rentpi-green hover:bg-gray-50 rounded-md">Buy</Link>
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-800 hover:text-rentpi-green hover:bg-gray-50 rounded-md">Community</Link>
            <div className="mt-4 flex flex-col gap-2 px-3">
              <button className="w-full text-center text-gray-600 hover:text-rentpi-green font-medium py-2 border border-gray-200 rounded-md">
                Login
              </button>
              <button className="w-full text-center bg-rentpi-green hover:bg-green-600 text-white py-2 rounded-md font-medium">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
