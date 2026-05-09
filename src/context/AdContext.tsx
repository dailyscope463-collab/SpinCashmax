import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AdMob, RewardAdOptions, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';
import { useToast } from "../components/ui/Toast";

interface AdContextType {
  showAd: (onComplete: () => void, onCancel?: () => void) => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export function useAd() {
  const context = useContext(AdContext);
  if (!context) throw new Error("useAd must be used within AdProvider");
  return context;
}

export function AdProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [simulatedAdOpen, setSimulatedAdOpen] = useState(false);
  const [onAdComplete, setOnAdComplete] = useState<(() => void) | null>(null);
  const [onAdCancel, setOnAdCancel] = useState<(() => void) | null>(null);

  useEffect(() => {
    let dismissListener: any;
    let loadListener: any;
    let failListener: any;

    const initAdMob = async () => {
      try {
        await AdMob.initialize({
          initializeForTesting: true
        });
        setIsInitialized(true);
        loadAd();
        
        loadListener = await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
          console.log("Ad loaded successfully");
        });

        failListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
          console.error('Failed to load ad', err);
          setTimeout(loadAd, 10000);
        });

        dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          loadAd(); // Preload next ad
        });
      } catch (e) {
        console.error("AdMob Init Error", e);
      }
    };
    initAdMob();
    
    return () => {
      if (dismissListener) dismissListener.remove();
      if (loadListener) loadListener.remove();
      if (failListener) failListener.remove();
    };
  }, []);

  const loadAd = async () => {
    try {
      const options: RewardAdOptions = {
        adId: 'ca-app-pub-9352983809793592/7213743820',
        isTesting: true,
      };
      await AdMob.prepareRewardVideoAd(options);
    } catch (e) {
      console.error("Load Ad Error", e);
    }
  };

  const showAd = async (onComplete: () => void, onCancel?: () => void) => {
    try {
      let rewarded = false;
      
      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (rewardItem: AdMobRewardItem) => {
        rewarded = true;
        onComplete();
        rewardListener.remove();
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        if (!rewarded && onCancel) {
          onCancel();
        }
        dismissListener.remove();
      });

      await AdMob.showRewardVideoAd().catch(async () => {
         // If it fails to show (e.g. not prepared), try preparing it
         await loadAd();
         return AdMob.showRewardVideoAd();
      });
    } catch (e) {
      console.error("AdMob failed, falling back to simulated ad for web", e);
      setOnAdComplete(() => onComplete);
      setOnAdCancel(() => onCancel);
      setSimulatedAdOpen(true);
    }
  };

  const finishSimulatedAd = () => {
    setSimulatedAdOpen(false);
    if (onAdComplete) onAdComplete();
    setOnAdComplete(null);
    setOnAdCancel(null);
  };

  const cancelSimulatedAd = () => {
    setSimulatedAdOpen(false);
    if (onAdCancel) onAdCancel();
    setOnAdComplete(null);
    setOnAdCancel(null);
  };

  return (
    <AdContext.Provider value={{ showAd }}>
      {children}
      {simulatedAdOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-white mb-4">Simulated Ad</h2>
            <p className="text-slate-400 mb-8">
              This is a simulated ad for the web version. On native devices, a real AdMob video will play here.
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelSimulatedAd}
                className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                Close View
              </button>
              <button
                onClick={finishSimulatedAd}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-500 transition-colors"
              >
                Earn Reward
              </button>
            </div>
          </div>
        </div>
      )}
    </AdContext.Provider>
  );
}
