import React from 'react';
import { motion } from 'framer-motion';
import { Coins, RefreshCcw, Shield } from 'lucide-react';

const CreditSystem: React.FC = () => {
  const cards = [
    {
      Icon: Coins,
      title: 'Earn Credits',
      description: 'Every time you lend an item out, you earn RentPi credits in your wallet. The more high-quality items you list, the more your balance grows.'
    },
    {
      Icon: RefreshCcw,
      title: 'Spend Credits',
      description: "Use your earned credits to rent items from others. Don't have enough credits? You can seamlessly split the payment between credits and cash."
    },
    {
      Icon: Shield,
      title: 'Gain Trust',
      description: "Active users with a strong history of smooth transactions receive a 'Trusted' badge, lowering required deposits and increasing visibility."
    }
  ];

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The RentPi <span className="text-green-400">Credit System</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A circular economy powered by trust. Use fiat currency or earn credits to access what you need without spending cash.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map(({ Icon, title, description }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ y: -8 }}
              className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700 hover:border-green-500/50 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                <Icon className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-slate-400 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreditSystem;
