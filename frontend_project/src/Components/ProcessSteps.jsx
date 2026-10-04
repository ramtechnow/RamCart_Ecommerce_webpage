import React from "react";
import { Truck, ShieldCheck, RefreshCw } from "lucide-react";

const ProcessSteps = () => {
  const steps = [
    {
      step: "01",
      icon: <Truck size={22} className="text-[#ff8906]" />,
      title: "Fast Express Delivery",
      description: "Quick, dependable shipping across India with live parcel tracking updates."
    },
    {
      step: "02",
      icon: <ShieldCheck size={22} className="text-[#ff8906]" />,
      title: "100% Encrypted Checkout",
      description: "Bank-grade secure checkout supporting UPI, NetBanking, and all major cards."
    },
    {
      step: "03",
      icon: <RefreshCw size={22} className="text-[#ff8906]" />,
      title: "30-Day Easy Returns",
      description: "Not the perfect fit? Enjoy hassle-free doorstep exchange or full refunds."
    }
  ];

  return (
    <div className="my-10 sm:my-14 p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
      <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#171622] p-6 sm:p-8 border border-black/5 dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`group flex flex-col items-center sm:items-start text-center sm:text-left transition-all duration-300 ${index > 0 ? "pt-6 md:pt-0 md:pl-8" : ""}`}
            >
              <div className="w-full flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ff8906]/10 dark:bg-[#ff8906]/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm">
                  {step.icon}
                </div>
                <span className="text-[11px] font-mono font-black text-[#ff8906] bg-[#ff8906]/10 px-2.5 py-0.5 rounded-full tracking-widest">
                  STEP {step.step}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#0f0e17] dark:text-[#fffffe] tracking-tight mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#717388] dark:text-[#a7a9be] leading-relaxed max-w-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessSteps;
