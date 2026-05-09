import React, { useState } from "react";
import AuthView from "./components/AuthView";
import BottomNav, { TabType } from "./components/BottomNav";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { AdProvider } from "./context/AdContext";
import { DashboardView, ReferralsView, SpinWheelView, WithdrawView, SettingsView, AdminView } from "./components/views";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5s splash screen
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/20 rounded-full blur-[80px]" />
        
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 z-10"
        >
          {/* Logo / App Icon placeholder */}
          <motion.div 
            animate={{ 
              rotate: 360 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-1"
          >
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
              <span className="text-4xl">🎡</span>
            </div>
          </motion.div>
          
          <div className="text-center space-y-2">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"
            >
              Spin & Earn
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 tracking-widest uppercase text-sm font-bold"
            >
              Loading...
            </motion.p>
          </div>
        </motion.div>
        
        {/* Progress bar */}
        <motion.div 
          className="absolute bottom-16 w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  // Animation variants for tab transitions
  const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div className="min-h-dvh max-w-lg mx-auto bg-slate-950 relative shadow-2xl flex flex-col overflow-x-hidden">
      
      {/* Dynamic Header visual based on tab? Or keep clean. Let's keep clean. */}

      <div className="flex-1 flex flex-col relative w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
              <DashboardView navigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === "spin" && (
            <motion.div key="spin" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
              <SpinWheelView />
            </motion.div>
          )}
          {activeTab === "referrals" && (
            <motion.div key="referrals" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
              <ReferralsView />
            </motion.div>
          )}
          {activeTab === "withdraw" && (
            <motion.div key="withdraw" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
              <WithdrawView navigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === "settings" && (
            <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
              <SettingsView navigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === "admin" && (
            <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
              <AdminView navigate={setActiveTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeTab !== "admin" && (
        <BottomNav activeTab={activeTab === "withdraw" ? "home" : activeTab} onChange={setActiveTab} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdProvider>
          <MainApp />
        </AdProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
