import React from "react";
import { Code, Briefcase, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 pt-16 pb-8 text-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="gap-12 grid grid-cols-1 md:grid-cols-3 mb-12">
          {/* Left Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-bold text-2xl">RentPi</span>
            </div>
            <p className="mb-6 max-w-sm text-slate-400">
              Own less, access more. RentPi (Brittoo) is your community marketplace to rent, barter,
              and share items sustainably.
            </p>
          </div>

          {/* Middle Column */}
          <div>
            <h3 className="mb-4 font-semibold text-white text-lg">Contact Developer</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/inj-src/hackspark-starter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-rentpi-green transition-colors"
                >
                  <Code className="w-5 h-5" /> GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-rentpi-green transition-colors"
                >
                  <Briefcase className="w-5 h-5" /> LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="mailto:developer@example.com"
                  className="flex items-center gap-2 text-slate-400 hover:text-rentpi-green transition-colors"
                >
                  <Mail className="w-5 h-5" /> Email
                </a>
              </li>
            </ul>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="mb-4 font-semibold text-white text-lg">Newsletter</h3>
            <p className="mb-4 text-slate-400">Get the latest updates and offers.</p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="bg-slate-800 px-4 py-2 border border-slate-700 focus:border-rentpi-green rounded-md focus:outline-none focus:ring-1 focus:ring-rentpi-green text-white placeholder-slate-500"
              />
              <button
                type="submit"
                className="bg-green-800 bg-rentpi-green hover:bg-green-600 px-4 py-2 rounded-md font-medium text-white transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="flex md:flex-row flex-col justify-between items-center pt-8 border-slate-800 border-t text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} RentPi (Brittoo). All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
