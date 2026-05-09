import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAd } from "../../context/AdContext";
import { useAppConfig } from "../../hooks/useAppConfig";
import { useToast } from "../ui/Toast";
import { motion } from "motion/react";
import { Coins, Hexagon, Loader2, Video } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import confetti from "canvas-confetti";

const SEGMENTS = [
  { label: "0 😢", value: 0, color: "#1e293b" },    // Slate 800
  { label: "5 💰", value: 5, color: "#8b5cf6" },   // Purple 500
  { label: "10 💰", value: 10, color: "#3b82f6" },  // Blue 500
  { label: "15 💰", value: 15, color: "#06b6d4" },  // Cyan 500
  { label: "20 💰", value: 20, color: "#a855f7" },  // Purple 400
  { label: "0 😢", value: 0, color: "#334155" },    // Slate 700
  { label: "5 💰", value: 5, color: "#6366f1" },  // Indigo 500
  { label: "10 💰", value: 10, color: "#f59e0b" }, // Amber 500
];

export function SpinWheelView() {
  const { userData, refreshUserData } = useAuth();
  const { config } = useAppConfig();
  const { toast } = useToast();
  const { showAd } = useAd();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [watchingAd, setWatchingAd] = useState(false);

  const dynamicSegments = useMemo(() => {
    const vals = config.spinValues && config.spinValues.length > 0 ? config.spinValues : SEGMENTS.map(s => s.value);
    return vals.map((val, i) => {
      // Keep old colors mapping or just reuse colors from SEGMENTS cyclically
      const existing = SEGMENTS[i % SEGMENTS.length];
      return { 
        label: `${val} ${val > 0 ? '💰' : '😢'}`, 
        value: val, 
        color: existing.color 
      };
    });
  }, [config.spinValues]);
  
  const segmentAngle = 360 / dynamicSegments.length;
  const halfSegment = segmentAngle / 2;

  // Build conic-gradient for the wheel background
  const conicGradient = `conic-gradient(${dynamicSegments.map((seg, i) => `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`).join(', ')})`;

  const getSpinsData = () => {
    if (!userData) return { used: 0, left: 5 };
    const todayStr = new Date().toDateString();
    const lastSpinStr = userData.lastSpinDate ? new Date(userData.lastSpinDate).toDateString() : "";
    const used = lastSpinStr === todayStr ? (userData.spinsToday || 0) : 0;
    const left = Math.max(0, 5 - used);
    return { used, left };
  };

  const { used, left: spinsLeft } = getSpinsData();

  const handleStartSpinSequence = () => {
    if (!userData) return;
    if (isSpinning || watchingAd) return;
    
    if (spinsLeft <= 0) {
      toast("Daily Spin Limit Reached. Come back tomorrow.", "warning");
      return;
    }

    // Force ad watching
    setWatchingAd(true);
    
    // Show AdModal first before spinning
    showAd(() => {
      // Completed ad properly
      setWatchingAd(false);
      executeSpin();
    }, () => {
      // Cancelled ad
      setWatchingAd(false);
      toast("Ad skipped, spin cancelled.", "info");
    });
  };

  const executeSpin = () => {
    setIsSpinning(true);

    const targetSegmentIndex = Math.floor(Math.random() * dynamicSegments.length);
    const targetValue = dynamicSegments[targetSegmentIndex].value;

    const targetCenterAngle = (targetSegmentIndex * segmentAngle) + halfSegment;
    const baseTargetAngle = 360 - targetCenterAngle;

    const currentMod = rotation % 360;
    let diff = baseTargetAngle - currentMod;
    if (diff <= 0) diff += 360; 

    const randomOffset = (Math.random() * (segmentAngle * 0.8)) - (segmentAngle * 0.4);
    const totalSpins = 5 * 360; 
    const newTotalRotation = rotation + totalSpins + diff + randomOffset;

    setRotation(newTotalRotation);

    setTimeout(async () => {
      if (targetValue > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#3b82f6', '#f59e0b', '#ffffff']
        });
        toast(`You won ${targetValue} coins! 🎉`, "success");
      } else {
        toast("Better luck next time!", "info");
      }

      // Update Firestore independently of frontend result to prevent bypass
      const todayStr = new Date().toDateString();
      const lastSpinStr = userData!.lastSpinDate ? new Date(userData!.lastSpinDate).toDateString() : "";
      const currentSpinsToday = lastSpinStr === todayStr ? (userData!.spinsToday || 0) : 0;

      await updateDoc(doc(db, "users", userData!.uid), {
        coins: userData!.coins + targetValue,
        earnings: userData!.earnings + targetValue,
        spinsToday: currentSpinsToday + 1,
        lastSpinDate: Date.now()
      });
      await refreshUserData();
      
      setIsSpinning(false);
    }, 4000); 
  };

  return (
    <div className="flex-1 pb-24 w-full px-4 pt-6 flex flex-col items-center">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">Spin & Win</h1>
        <p className="text-slate-400 text-sm">Test your luck to earn massive amounts of coins!</p>
        <p className="inline-block mt-2 bg-slate-800 border border-slate-700 text-purple-300 font-semibold px-3 py-1 rounded-full text-xs">
          {spinsLeft} Spins Left Today
        </p>
      </div>

      <div className="relative w-[300px] h-[300px] mb-12 mt-4">
        <div className="absolute inset-[-20px] bg-purple-500/20 rounded-full blur-2xl" />
        
        <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-20 drop-shadow-xl text-white pointer-events-none">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L20 10H15V22H9V10H4L12 2Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          </svg>
        </div>

        <div className="absolute inset-0 rounded-full border-[10px] border-slate-800 shadow-2xl overflow-hidden z-10 bg-slate-900 border-x-purple-500/50 border-y-blue-500/50">
          <motion.div 
             animate={{ rotate: rotation }}
             transition={{ duration: 4, ease: [0.2, 0.8, 0.2, 1] }}
             className="w-full h-full rounded-full relative overflow-hidden"
             style={{ background: conicGradient }}
          >
            {dynamicSegments.map((segment, index) => {
              const labelRotation = (index * segmentAngle) + halfSegment;
              return (
                <div 
                  key={index}
                  className="absolute top-0 left-1/2 w-[60px] h-[50%] pt-4 text-center z-10 flex flex-col items-center"
                  style={{ 
                    transformOrigin: '50% 100%',
                    transform: `translateX(-50%) rotate(${labelRotation}deg)`
                  }}
                >
                  <span className="text-white font-bold text-[15px] tracking-wider drop-shadow-md">
                    {segment.label.split(' ')[0]}
                  </span>
                  <span className="text-xl mt-1 drop-shadow-md">
                    {segment.label.split(' ')[1]}
                  </span>
                </div>
              )
            })}
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 rounded-full border-4 border-slate-700 z-20 flex items-center justify-center shadow-inner">
              <Hexagon className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </motion.div>
        
        </div>
      </div>

      {/* Ad Simulation Overlay */}
      {/* Handled by global AdModal now */}

      <button
        onClick={handleStartSpinSequence}
        disabled={isSpinning || watchingAd || spinsLeft <= 0}
        className="w-full max-w-[280px] bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 active:scale-95 transition-all text-white rounded-full py-4 font-black shadow-lg shadow-purple-500/30 text-lg tracking-widest uppercase disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
      >
        {isSpinning ? 'Spinning...' : spinsLeft <= 0 ? 'LIMIT REACHED' : (
          <>
            <Video className="w-5 h-5" /> WATCH AD TO SPIN
          </>
        )}
      </button>
      
      <div className="mt-8 glass-card px-6 py-4 rounded-3xl flex items-center gap-4 w-full max-w-[280px]">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
          <Coins className="text-orange-400 w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Your Balance</p>
          <p className="font-bold text-white">{userData?.coins || 0}</p>
        </div>
      </div>

    </div>
  );
}
