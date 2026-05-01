import React from 'react';
import { Code, Briefcase, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Left Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-rentpi-green rounded-lg flex items-center justify-center text-white font-bold">R</div>
              <span className="text-2xl font-bold">RentPi</span>
            </div>
            <p className="text-slate-400 mb-6 max-w-sm">
              Own less, access more. RentPi (Brittoo) is your community marketplace to rent, barter, and share items sustainably.
            </p>
          </div>

          {/* Middle Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Developer</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-rentpi-green transition-colors flex items-center gap-2">
                  <Code className="w-5 h-5" /> GitHub
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-rentpi-green transition-colors flex items-center gap-2">
                  <Briefcase className="w-5 h-5" /> LinkedIn
                </a>
              </li>
              <li>
                <a href="mailto:developer@example.com" className="text-slate-400 hover:text-rentpi-green transition-colors flex items-center gap-2">
                  <Mail className="w-5 h-5" /> Email
                </a>
              </li>
            </ul>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Newsletter</h3>
            <p className="text-slate-400 mb-4">Get the latest updates and offers.</p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rentpi-green focus:ring-1 focus:ring-rentpi-green"
              />
              <button 
                type="submit" 
                className="bg-rentpi-green hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} RentPi (Brittoo). All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
