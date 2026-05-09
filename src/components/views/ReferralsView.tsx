import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/Toast";
import { Copy, Share2, Users, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function ReferralsView() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!userData) return null;

  const referralLink = `${window.location.origin}?ref=${userData.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast("Referral code copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SpinCash',
          text: `Use my referral code ${userData.referralCode} to get 50 bonus coins on SpinCash!`,
          url: referralLink,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="flex-1 pb-24 w-full px-4 pt-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Refer & Earn</h1>
        <p className="text-slate-400 text-sm">Invite friends and earn 100 coins for each successful registration!</p>
      </div>

      <div className="glass-card rounded-3xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Your Referral Code</h3>
        
        <div className="relative mb-6">
          <div className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl py-4 flex items-center justify-center text-2xl font-black font-mono tracking-widest text-purple-400 ring-2 ring-purple-500/20">
            {userData.referralCode}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={copyToClipboard}
            className="bg-slate-800 hover:bg-slate-700 transition-colors py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 text-sm border border-slate-700"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          
          <button 
            onClick={shareLink}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 text-sm text-white"
          >
            <Share2 className="w-4 h-4" />
            Share Now
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest ml-1">How it works</h3>
        
        <div className="glass-card rounded-2xl p-4 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-purple-400 shrink-0">1</div>
          <div>
            <h4 className="font-semibold mb-1 text-[15px]">Share your link</h4>
            <p className="text-slate-400 text-sm">Send your unique link or code to your friends.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-purple-400 shrink-0">2</div>
          <div>
            <h4 className="font-semibold mb-1 text-[15px]">Friend signs up</h4>
            <p className="text-slate-400 text-sm">They must click your link or enter your code during registration.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-purple-400 shrink-0">3</div>
          <div>
            <h4 className="font-semibold mb-1 text-[15px]">You both get rewarded</h4>
            <p className="text-slate-400 text-sm">You receive <span className="text-purple-400 font-bold">100 coins</span>, and your friend gets <span className="text-blue-400 font-bold">50 starter coins</span>!</p>
          </div>
        </div>

      </div>
    </div>
  );
}
