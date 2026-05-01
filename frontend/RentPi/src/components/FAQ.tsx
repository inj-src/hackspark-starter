import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { FAQItem } from '../types';

const faqs: FAQItem[] = [
  { id: '1', question: 'How does the deposit system work?', answer: 'When you rent an item, a hold is placed on your card for the deposit amount. Once the item is returned in the same condition, the hold is released immediately. If you have a high Trust Score, your required deposit amount is significantly reduced.' },
  { id: '2', question: 'What happens if an item gets damaged?', answer: 'RentPi offers optional damage protection for a small fee during checkout. If you decline it and the item is damaged, the repair or replacement cost will be deducted from your deposit or charged to your account.' },
  { id: '3', question: 'How do I earn and use RentPi credits?', answer: 'You earn credits whenever someone rents your listed items. These credits are stored in your wallet and can be used to rent items from others on the platform. 1 Credit is equivalent to $1.' },
  { id: '4', question: 'Is it safe to meet up with strangers?', answer: 'Safety is our top priority. We require ID verification for all users. We recommend meeting in well-lit, public locations for handoffs, or using our suggested "Safe Exchange Zones" available in many cities.' },
  { id: '5', question: 'Can I cancel a booking?', answer: 'Yes. Cancellations made 48 hours before the rental period are fully refunded. Cancellations within 48 hours may be subject to a small cancellation fee to compensate the owner for reserving the dates.' }
];

const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(faqs[0].id);

  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 dark:text-slate-400">Everything you need to know about RentPi.</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className={`bg-white dark:bg-slate-800 border rounded-2xl overflow-hidden transition-colors ${isOpen ? 'border-green-500' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}>
                <button className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none" onClick={() => setOpenId(isOpen ? null : faq.id)}>
                  <span className={`font-semibold text-lg ${isOpen ? 'text-green-500' : 'text-slate-900 dark:text-slate-100'}`}>{faq.question}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className={`flex-shrink-0 ml-4 ${isOpen ? 'text-green-500' : 'text-gray-400 dark:text-slate-500'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                      <div className="px-6 pb-5 text-gray-600 dark:text-slate-400 leading-relaxed">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
