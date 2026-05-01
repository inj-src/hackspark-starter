import React from 'react';
import { Coins, RefreshCcw, Shield } from 'lucide-react';

const CreditSystem: React.FC = () => {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-rentpi-green/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The RentPi <span className="text-rentpi-green">Credit System</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A circular economy powered by trust. Use fiat currency or earn credits to access what you need without spending cash.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 hover:border-rentpi-green/50 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300 group">
            <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rentpi-green/20 transition-colors">
              <Coins className="w-7 h-7 text-rentpi-green" />
            </div>
            <h3 className="text-xl font-bold mb-3">Earn Credits</h3>
            <p className="text-slate-400 leading-relaxed">
              Every time you lend an item out, you earn RentPi credits in your wallet. The more high-quality items you list, the more your balance grows.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 hover:border-rentpi-green/50 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300 group">
            <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rentpi-green/20 transition-colors">
              <RefreshCcw className="w-7 h-7 text-rentpi-green" />
            </div>
            <h3 className="text-xl font-bold mb-3">Spend Credits</h3>
            <p className="text-slate-400 leading-relaxed">
              Use your earned credits to rent items from others. Don't have enough credits? You can seamlessly split the payment between credits and cash.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 hover:border-rentpi-green/50 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300 group">
            <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rentpi-green/20 transition-colors">
              <Shield className="w-7 h-7 text-rentpi-green" />
            </div>
            <h3 className="text-xl font-bold mb-3">Gain Trust</h3>
            <p className="text-slate-400 leading-relaxed">
              Active users with a strong history of smooth transactions receive a 'Trusted' badge, lowering required deposits and increasing visibility.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreditSystem;
