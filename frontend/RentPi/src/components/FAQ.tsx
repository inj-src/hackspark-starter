import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { FAQItem } from '../types';

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How does the deposit system work?',
    answer: 'When you rent an item, a hold is placed on your card for the deposit amount. Once the item is returned in the same condition, the hold is released immediately. If you have a high Trust Score, your required deposit amount is significantly reduced.'
  },
  {
    id: '2',
    question: 'What happens if an item gets damaged?',
    answer: 'RentPi offers optional damage protection for a small fee during checkout. If you decline it and the item is damaged, the repair or replacement cost will be deducted from your deposit or charged to your account.'
  },
  {
    id: '3',
    question: 'How do I earn and use RentPi credits?',
    answer: 'You earn credits whenever someone rents your listed items. These credits are stored in your wallet and can be used to rent items from others on the platform. 1 Credit is equivalent to $1.'
  },
  {
    id: '4',
    question: 'Is it safe to meet up with strangers?',
    answer: 'Safety is our top priority. We require ID verification for all users. We recommend meeting in well-lit, public locations for handoffs, or using our suggested "Safe Exchange Zones" available in many cities.'
  },
  {
    id: '5',
    question: 'Can I cancel a booking?',
    answer: 'Yes. Cancellations made 48 hours before the rental period are fully refunded. Cancellations within 48 hours may be subject to a small cancellation fee to compensate the owner for reserving the dates.'
  }
];

const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(faqs[0].id);

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600">Everything you need to know about RentPi.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            
            return (
              <div 
                key={faq.id} 
                className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? 'border-rentpi-green shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                  onClick={() => toggleOpen(faq.id)}
                >
                  <span className={`font-semibold text-lg ${isOpen ? 'text-rentpi-green' : 'text-slate-900'}`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rentpi-green' : 'text-gray-400'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
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
