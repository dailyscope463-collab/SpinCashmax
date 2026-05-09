import { Home, PlayCircle, Users, Settings } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

export type TabType = "home" | "spin" | "referrals" | "settings" | "withdraw";

interface BottomNavProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "spin", icon: PlayCircle, label: "Spin" },
    { id: "referrals", icon: Users, label: "Refer" },
    { id: "settings", icon: Settings, label: "Settings" },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto glass-card rounded-full p-2 flex items-center justify-between shadow-2xl shadow-purple-900/20 pointer-events-auto border-white/10">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id as TabType)}
              className="relative p-3 rounded-full flex-1 flex flex-col items-center justify-center gap-1 transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={cn(
                  "w-6 h-6 transition-colors relative z-10",
                  isActive ? "text-purple-400" : "text-slate-400"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors relative z-10",
                  isActive ? "text-purple-300" : "text-slate-500"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
