import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink, 
  X,
  HelpCircle,
  Zap
} from 'lucide-react';

interface YoupiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  upiUri: string;
  merchantVpa: string;
  merchantName: string;
  expiresInSeconds?: number;
  onSubmitUtr: (utr: string, customerVpa: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const YoupiPaymentModal: React.FC<YoupiPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  upiUri,
  merchantVpa,
  merchantName,
  expiresInSeconds = 600,
  onSubmitUtr,
  isSubmitting = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(expiresInSeconds);
  const [utrInput, setUtrInput] = useState<string>('');
  const [customerVpaInput, setCustomerVpaInput] = useState<string>('');
  const [utrError, setUtrError] = useState<string>('');
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [showUtrHelp, setShowUtrHelp] = useState<boolean>(false);

  // Generate QR Code on mount or uri change
  useEffect(() => {
    if (upiUri) {
      QRCode.toDataURL(upiUri, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [upiUri]);

  // Security countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(expiresInSeconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expiresInSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, type: 'vpa' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'vpa') {
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');

    const clean = utrInput.trim();
    if (!clean) {
      setUtrError('Please enter the 12-digit UPI UTR number from your payment receipt');
      return;
    }
    if (!/^\d{12}$/.test(clean)) {
      setUtrError('UTR must be exactly 12 numeric digits (e.g. 412356789012)');
      return;
    }

    try {
      await onSubmitUtr(clean, customerVpaInput.trim());
    } catch (err: any) {
      setUtrError(err.message || 'Payment verification failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#15141e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase m-0 flex items-center gap-2">
                <span>YouPI Direct Gateway</span>
                <span className="text-[10px] bg-emerald-400/25 px-2 py-0.5 rounded-full font-bold">0% FEES</span>
              </h3>
              <p className="text-[11px] text-emerald-100 m-0">Direct Bank-to-Bank UPI Payment</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Order Summary Pill ── */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#1d1c2b] border-b border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Order ID: </span>
            <span className="font-extrabold text-slate-900 dark:text-white font-mono">#{orderId}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="text-sm">Total:</span>
              <span className="text-base font-black">₹{amount.toFixed(2)}</span>
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
              timeLeft < 120 ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              <Clock size={12} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#1a1926] rounded-xl border border-slate-200 dark:border-white/5">
            {qrDataUrl ? (
              <div className="relative p-2.5 bg-white rounded-xl shadow-md border border-slate-200">
                <img 
                  src={qrDataUrl} 
                  alt="Scan to Pay via UPI" 
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain block"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center">
                    <span className="text-[10px] font-black text-emerald-600">UPI</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
              </div>
            )}

            <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center flex items-center gap-1.5">
              <QrCode size={14} className="text-emerald-500" />
              <span>Scan using Google Pay, PhonePe, Paytm, or any UPI App</span>
            </p>

            {/* Merchant VPA & Copy Pill */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <div 
                onClick={() => handleCopy(merchantVpa, 'vpa')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-[#222133] border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-emerald-500 transition-colors"
                title="Click to copy UPI ID"
              >
                <span>Payee: {merchantName} &bull; {merchantVpa}</span>
                {copiedVpa ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
              </div>

              <div 
                onClick={() => handleCopy(amount.toFixed(2), 'amount')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#222133] border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-emerald-500 transition-colors"
                title="Click to copy Amount"
              >
                <span>₹{amount.toFixed(2)}</span>
                {copiedAmount ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
              </div>
            </div>
          </div>

          {/* Mobile Direct Pay Buttons (Open App) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Or Pay Directly On Mobile:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href={upiUri}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white no-underline transition-transform active:scale-95"
              >
                <Smartphone size={14} className="text-emerald-500" />
                <span>Google Pay</span>
              </a>
              <a
                href={upiUri}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white no-underline transition-transform active:scale-95"
              >
                <Smartphone size={14} className="text-purple-500" />
                <span>PhonePe</span>
              </a>
              <a
                href={upiUri}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white no-underline transition-transform active:scale-95"
              >
                <Smartphone size={14} className="text-sky-500" />
                <span>Paytm</span>
              </a>
              <a
                href={upiUri}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-400 no-underline transition-transform active:scale-95"
              >
                <ExternalLink size={14} />
                <span>Any UPI App</span>
              </a>
            </div>
          </div>

          {/* Step 2 Form: Confirm Payment with 12-Digit UTR */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 size={15} />
                <span>Step 2: Enter 12-Digit Bank UTR / Ref No</span>
              </span>
              <button
                type="button"
                onClick={() => setShowUtrHelp(!showUtrHelp)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer"
              >
                <HelpCircle size={13} />
                <span>Where to find UTR?</span>
              </button>
            </div>

            {showUtrHelp && (
              <div className="p-3 bg-white dark:bg-[#1a1926] rounded-lg border border-emerald-500/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-800 dark:text-white m-0">💡 How to find your 12-digit UTR:</p>
                <ul className="list-disc pl-4 space-y-0.5 m-0">
                  <li><strong>Google Pay:</strong> Open payment receipt &rarr; Tap &ldquo;UPI transaction ID&rdquo; (12 digits).</li>
                  <li><strong>PhonePe:</strong> Open transaction history &rarr; Look for &ldquo;UTR&rdquo; or &ldquo;Transaction ID&rdquo;.</li>
                  <li><strong>Paytm:</strong> View payment details &rarr; Copy &ldquo;UPI Ref No.&rdquo;.</li>
                </ul>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                12-Digit UPI Reference (UTR) Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="e.g. 412356789012"
                value={utrInput}
                onChange={(e) => {
                  setUtrInput(e.target.value.replace(/\D/g, ''));
                  setUtrError('');
                }}
                className="w-full h-11 px-3 text-sm font-mono font-bold tracking-widest rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1d1c2b] text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                {utrInput.length}/12 Digits entered
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Paying UPI ID <span className="text-slate-400 font-normal">(For 1-click refund if cancelled)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. yourname@okhdfcbank"
                value={customerVpaInput}
                onChange={(e) => setCustomerVpaInput(e.target.value)}
                className="w-full h-10 px-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1d1c2b] text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {utrError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{utrError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || utrInput.length !== 12 || timeLeft === 0}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Transaction with Bank...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm Payment with 12-Digit UTR</span>
                </>
              )}
            </button>

            {/* Alternative 1-Tap Confirmation for users who don't know UTR */}
            <div className="pt-1">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Don't know where UTR is?
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
              </div>

              <button
                type="button"
                disabled={isSubmitting || timeLeft === 0}
                onClick={async () => {
                  try {
                    await onSubmitUtr("APP_CONFIRMED", customerVpaInput.trim());
                  } catch (err: any) {
                    setUtrError(err.message || "Failed to confirm payment.");
                  }
                }}
                className="w-full mt-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-300 dark:border-white/10"
              >
                <Zap size={14} className="text-amber-500 shrink-0" />
                <span>I Have Paid in App (Confirm Order Instantly)</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1 m-0">
                Payment sent from GPay/PhonePe? Tap above to confirm without typing UTR!
              </p>
            </div>
          </form>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#1d1c2b] border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck size={13} />
            <span>Encrypted Direct UPI Transfer</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold bg-transparent border-none cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default YoupiPaymentModal;
