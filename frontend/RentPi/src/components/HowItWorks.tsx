import React from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, ShieldCheck, Camera, Tag, CreditCard } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const renterSteps = [
    { icon: Search, title: 'Find What You Need', description: 'Search for items near you using filters like category, price, and distance.' },
    { icon: Calendar, title: 'Book & Pay Securely', description: 'Select your dates and pay safely through our platform. Deposits are held securely.' },
    { icon: ShieldCheck, title: 'Pick Up & Use', description: 'Meet the owner, inspect the item, and get the job done. Return it when finished.' }
  ];

  const listerSteps = [
    { icon: Camera, title: 'Snap & List', description: 'Take clear photos, add a description, and set your daily, weekly, or hourly rate.' },
    { icon: Tag, title: 'Approve Requests', description: 'Review renter profiles and accept bookings that work for your schedule.' },
    { icon: CreditCard, title: 'Earn Money or Credits', description: 'Get paid securely to your bank account or earn RentPi credits to use yourself.' }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
  };

  return (
    <section className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">How RentPi Works</h2>
          <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
            Whether you need something for a weekend project or want to earn from your idle gear, we make it simple and safe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Renting Items */}
          <motion.div
            className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-gray-100 dark:border-slate-700 relative overflow-hidden"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-3">
              <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm uppercase tracking-wide">For Renters</span>
              Renting Items
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gray-200 dark:bg-slate-600" />
              {renterSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex gap-6">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-green-500 flex items-center justify-center flex-shrink-0 shadow-sm z-10 text-green-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h4>
                      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Listing Items */}
          <motion.div
            className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-gray-100 dark:border-slate-700 relative overflow-hidden"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.15 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-3">
              <span className="bg-slate-900 dark:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm uppercase tracking-wide">For Owners</span>
              Listing Your Items
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gray-200 dark:bg-slate-600" />
              {listerSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex gap-6">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-slate-900 dark:border-slate-400 flex items-center justify-center flex-shrink-0 shadow-sm z-10 text-slate-900 dark:text-slate-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h4>
                      <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
