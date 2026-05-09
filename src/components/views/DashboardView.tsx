import { useAuth } from "../../context/AuthContext";
import { useAd } from "../../context/AdContext";
import { useAppConfig } from "../../hooks/useAppConfig";
import { Coins, Gift, PlayCircle, History, LogOut, Loader2, Video, Youtube, Instagram } from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { format } from "date-fns";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "../ui/Toast";
import { useState } from "react";
import { motion } from "motion/react";

export function DashboardView({ navigate }: { navigate: (tab: any) => void }) {
  const { userData, refreshUserData } = useAuth();
  const { config } = useAppConfig();
  const { toast } = useToast();
  const { showAd } = useAd();
  const [claiming, setClaiming] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);

  const handleLogout = () => signOut(auth);

  const claimDaily = async () => {
    if (!userData) return;

    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (userData.lastClaim && now - userData.lastClaim < oneDayInMs) {
      toast("Daily reward already claimed today!", "warning");
      return;
    }

    setClaiming(true);

    showAd(async () => {
      try {
        let newStreak = userData.streak + 1;
        // Reset streak if more than 2 days have passed
        if (userData.lastClaim && now - userData.lastClaim > 2 * oneDayInMs) {
          newStreak = 1;
        }
        
        const coinsReward = Math.min(10 + (newStreak * 5), 100); // progressive reward up to 100
        
        const userRef = doc(db, "users", userData.uid);
        await updateDoc(userRef, {
          coins: userData.coins + coinsReward,
          earnings: userData.earnings + coinsReward,
          streak: newStreak,
          lastClaim: now
        });
        
        await refreshUserData();
        toast(`Claimed ${coinsReward} coins! Streak: ${newStreak} fire!`, "success");
      } catch (e) {
        toast("Failed to claim daily reward", "error");
      } finally {
        setClaiming(false);
      }
    }, () => {
      setClaiming(false);
      toast("Ad skipped, reward not claimed.", "info");
    });
  };

  const watchAd = () => {
    if (!userData || !canWatchAd) return;
    setWatchingAd(true);
    
    showAd(async () => {
      try {
        const adReward = 15;
        const userRef = doc(db, "users", userData.uid);
        await updateDoc(userRef, {
          coins: userData.coins + adReward,
          earnings: userData.earnings + adReward,
          lastAdWatch: Date.now()
        });
        await refreshUserData();
        toast("Thanks for watching! +15 coins added.", "success");
      } catch (e) {
        toast("Reward failed", "error");
      } finally {
        setWatchingAd(false);
      }
    }, () => {
      setWatchingAd(false);
      toast("Ad skipped, reward cancelled.", "info");
    });
  };

  if (!userData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Calculate if daily is claimable today
  const canClaimDaily = !userData.lastClaim || (Date.now() - userData.lastClaim) >= (24 * 60 * 60 * 1000);
  const canWatchAd = !userData.lastAdWatch || (Date.now() - userData.lastAdWatch) >= (60 * 60 * 1000);

  return (
    <div className="flex-1 pb-24 mt-safe w-full">
      {/* Header Profile Area */}
      <div className="flex items-center justify-between p-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30 p-0.5">
            <img src={userData.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Welcome back</p>
            <h2 className="text-lg font-bold text-white leading-tight truncate max-w-[150px]">{userData.name}</h2>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 rounded-full transition-colors border border-slate-700">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Balance Card Section */}
      <div className="px-4 mt-2">
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-[28px] p-6 text-white shadow-2xl shadow-purple-600/20 relative overflow-hidden">
          {/* Glass Overlay effects */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 blur-xl rounded-full -translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10">
            <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wide">Total Balance</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl sm:text-5xl font-black">{userData.coins}</span>
              <span className="text-xl font-bold text-white/90 mb-1">Coins</span>
            </div>
            <p className="text-sm font-medium text-green-400 mt-1 mb-6 bg-green-500/10 inline-block px-2 py-1 rounded-md border border-green-500/20">
              ≈ ₹{(userData.coins / 100).toFixed(2)}
            </p>
            
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={() => navigate('withdraw')}
                className="flex-1 bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors backdrop-blur-md px-4 py-2.5 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                Withdraw <span className="text-xl leading-none">&rarr;</span>
              </button>
            </div>
            
            <div className="mt-6 flex justify-between items-center text-sm border-t border-white/20 pt-4">
              <div className="flex flex-col">
                <span className="text-white/60">Total Earnings</span>
                <span className="font-semibold">{userData.earnings} Coins</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex flex-col text-right">
                <span className="text-white/60">Current Streak</span>
                <span className="font-semibold">{userData.streak} Days 🔥</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Features */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4 ml-1">Ways to Earn</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          
          {/* Daily Reward Card */}
          <button 
            onClick={claimDaily}
            disabled={!canClaimDaily || claiming}
            className="glass-card rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${canClaimDaily ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-[15px]">{canClaimDaily ? 'Claim Daily' : 'Claimed'}</h4>
              <p className="text-xs text-slate-400 mt-1">Get free coins</p>
            </div>
            {canClaimDaily && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            )}
          </button>

          {/* Spin Wheel Card */}
          <button 
            onClick={() => navigate('spin')}
            className="glass-card rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:bg-slate-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-[15px]">Spin Wheel</h4>
              <p className="text-xs text-slate-400 mt-1">Try your luck</p>
            </div>
          </button>
          
        </div>
      </div>

      {/* Ad Watch Task */}
      <div className="px-4 mt-4">
        <button 
          onClick={watchAd}
          disabled={watchingAd || !canWatchAd}
          className="w-full glass-card hover:bg-slate-800 transition-colors rounded-3xl p-4 flex items-center gap-4 text-left relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 relative z-10">
            <Video className="w-6 h-6" />
          </div>
          <div className="flex-1 relative z-10">
            <h4 className="font-semibold">{!canWatchAd ? 'Come back in an hour' : 'Watch Video'}</h4>
            <p className="text-xs text-slate-400 mt-0.5">Earn +15 coins instantly</p>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-full relative z-10">
            <span className="text-xs font-bold text-blue-400">+15</span>
          </div>
        </button>
      </div>

      {/* Social Links */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4 ml-1">Follow Us</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <a 
            href={config.youtube || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card hover:bg-slate-800 transition-colors rounded-2xl p-4 flex items-center justify-center gap-3 text-red-500 font-semibold"
          >
            <Youtube className="w-5 h-5" /> YouTube
          </a>
          <a 
            href={config.instagram || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card hover:bg-slate-800 transition-colors rounded-2xl p-4 flex items-center justify-center gap-3 text-pink-500 font-semibold"
          >
            <Instagram className="w-5 h-5" /> Instagram
          </a>
        </div>
      </div>

    </div>
  );
}
