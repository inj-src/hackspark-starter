import React from 'react';
import { Search, Calendar, ShieldCheck, Camera, Tag, CreditCard } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const renterSteps = [
    {
      icon: Search,
      title: "Find What You Need",
      description: "Search for items near you using filters like category, price, and distance."
    },
    {
      icon: Calendar,
      title: "Book & Pay Securely",
      description: "Select your dates and pay safely through our platform. Deposits are held securely."
    },
    {
      icon: ShieldCheck,
      title: "Pick Up & Use",
      description: "Meet the owner, inspect the item, and get the job done. Return it when finished."
    }
  ];

  const listerSteps = [
    {
      icon: Camera,
      title: "Snap & List",
      description: "Take clear photos, add a description, and set your daily, weekly, or hourly rate."
    },
    {
      icon: Tag,
      title: "Approve Requests",
      description: "Review renter profiles and accept bookings that work for your schedule."
    },
    {
      icon: CreditCard,
      title: "Earn Money or Credits",
      description: "Get paid securely to your bank account or earn RentPi credits to use yourself."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How RentPi Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you need something for a weekend project or want to earn from your idle gear, we make it simple and safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Renting Items */}
          <div className="bg-slate-50 rounded-3xl p-8 sm:p-10 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rentpi-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <span className="bg-rentpi-green text-white px-3 py-1 rounded-lg text-sm uppercase tracking-wide">For Renters</span>
              Renting Items
            </h3>
            
            <div className="space-y-8 relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gray-200" />
              
              {renterSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex gap-6">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-rentpi-green flex items-center justify-center flex-shrink-0 shadow-sm z-10 text-rentpi-green">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listing Items */}
          <div className="bg-slate-50 rounded-3xl p-8 sm:p-10 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-sm uppercase tracking-wide">For Owners</span>
              Listing Your Items
            </h3>
            
            <div className="space-y-8 relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gray-200" />
              
              {listerSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex gap-6">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm z-10 text-slate-900">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
