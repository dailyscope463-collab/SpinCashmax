import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useToast } from "../components/ui/Toast";
import { motion } from "motion/react";
import { Mail, Lock, LogIn, UserPlus, Hash } from "lucide-react";

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If opening from a referral link, auto-fill the code field
    const code = localStorage.getItem("referralCode");
    if (code) {
      setRefCode(code);
      setIsLogin(false); // Likely trying to register
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Please enter email and password.", "error");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast("Welcome back!", "success");
      } else {
        // If registering, set ref code in localStorage so AuthContext picks it up
        if (refCode.trim()) {
          localStorage.setItem("referralCode", refCode.trim().toUpperCase());
        }
        await createUserWithEmailAndPassword(auth, email, password);
        toast("Account created successfully!", "success");
      }
    } catch (error: any) {
      toast(error.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (!isLogin && refCode.trim()) {
        localStorage.setItem("referralCode", refCode.trim().toUpperCase());
      }
      await signInWithPopup(auth, googleProvider);
      toast("Signed in with Google", "success");
    } catch (error: any) {
      toast(error.message || "Google sign in failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast("Please enter your email first.", "warning");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast("Password reset email sent!", "success");
    } catch (error: any) {
      toast(error.message || "Reset failed", "error");
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-purple-600/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-blue-600/30 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 mb-4 shadow-lg shadow-purple-500/20">
            <span className="text-3xl font-bold text-white tracking-tighter">SC</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">SpinCash</h1>
          <p className="text-slate-400">Play, Spin and Earn Real Money</p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 relative z-10 overflow-hidden">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm placeholder:text-slate-600"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1 overflow-hidden"
              >
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 flex justify-between">
                  <span>Referral Code</span>
                  <span className="text-slate-500 font-normal text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm placeholder:text-slate-600 uppercase"
                    placeholder="ENTER CODE"
                    maxLength={8}
                  />
                </div>
              </motion.div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl py-3.5 font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                <>Login to Account <LogIn className="w-4 h-4" /></>
              ) : (
                <>Create Account <UserPlus className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">or continue with</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3.5 font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-slate-700 hover:border-slate-600"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>

        <div className="mt-8 text-center relative z-20">
          <p className="text-slate-400 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-400 font-medium hover:text-purple-300 transition-colors z-20 relative cursor-pointer"
            >
              {isLogin ? "Register Now" : "Login Instead"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
