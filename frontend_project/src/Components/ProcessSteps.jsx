import React from "react";
import { Truck, ShieldCheck, RefreshCw } from "lucide-react";

const ProcessSteps = () => {
  const steps = [
    {
      step: "01",
      icon: <Truck size={18} className="text-[#ff8906] sm:w-[22px] sm:h-[22px]" />,
      title: "Fast Express Delivery across India",
      description: "Shipped quickly to your doorstep with live SMS & WhatsApp delivery updates."
    },
    {
      step: "02",
      icon: <ShieldCheck size={18} className="text-[#ff8906] sm:w-[22px] sm:h-[22px]" />,
      title: "Safe UPI, Cards & Cash on Delivery",
      description: "Pay easily with Google Pay, PhonePe, Paytm, Debit/Credit Cards or Cash on Delivery."
    },
    {
      step: "03",
      icon: <RefreshCw size={18} className="text-[#ff8906] sm:w-[22px] sm:h-[22px]" />,
      title: "7-Day Easy Returns & Exchange",
      description: "Size doesn't match? Simple doorstep pickup and instant exchange or refund."
    }
  ];

  return (
    <div className="my-3 sm:my-4 p-0 rounded-none bg-transparent">
      <div className="rounded-none bg-white dark:bg-[#171622] p-3 sm:p-5 border border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`group flex flex-col items-center sm:items-start text-center sm:text-left transition-all duration-300 ${index > 0 ? "pt-4 md:pt-0 md:pl-8" : ""}`}
            >
              <div className="w-full flex items-center justify-between mb-2.5 sm:mb-4">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-none bg-[#ff8906]/10 dark:bg-[#ff8906]/20 border border-[#ff8906]/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  {step.icon}
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#ff8906] bg-[#ff8906]/10 px-2 py-0.5 rounded-none tracking-wider">
                  STEP {step.step}
                </span>
              </div>
              <h3 className="text-xs sm:text-base font-extrabold text-[#0f0e17] dark:text-[#fffffe] tracking-tight mb-1">
                {step.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#717388] dark:text-[#a7a9be] leading-relaxed max-w-xs sm:max-w-sm">
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
