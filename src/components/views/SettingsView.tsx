import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppConfig } from "../../hooks/useAppConfig";
import { useToast } from "../ui/Toast";
import { Wallet, Phone, Shield, MessageSquare, LogOut, Hash, ChevronRight, UserCircle, FileText, CheckCircle2, Crown, X } from "lucide-react";
import { signOut, updatePassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDocs, query, collection, where, updateDoc, addDoc } from "firebase/firestore";

export function SettingsView({ navigate }: { navigate: (tab: any) => void }) {
  const { userData, refreshUserData } = useAuth();
  const { config } = useAppConfig();
  const { toast } = useToast();
  const [resettingPwd, setResettingPwd] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!userData) return null;

  const handleLogout = () => signOut(auth);

  const handleContactUs = () => {
    const url = `https://wa.me/${config.whatsapp}`;
    window.open(url, "_blank");
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast("Enter your feedback first", "warning");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await addDoc(collection(db, "feedbacks"), {
        userId: userData.uid,
        userEmail: userData.email,
        message: feedbackText,
        createdAt: Date.now()
      });
      toast("Feedback submitted! Thank you.", "success");
      setFeedbackText("");
      setShowFeedback(false);
    } catch {
      toast("Error submitting feedback", "error");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast("Password must be at least 6 characters.", "warning");
      return;
    }
    if (!auth.currentUser) return;
    
    setResettingPwd(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast("Password updated successfully!", "success");
      setNewPassword("");
      setShowPasswordChange(false);
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        toast("Please log out and log back in to change your password.", "error");
      } else {
        toast("Failed to update password.", "error");
      }
    } finally {
      setResettingPwd(false);
    }
  };

  return (
    <div className="flex-1 pb-24 w-full px-4 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/30 p-0.5 shrink-0">
          <img src={userData.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{userData.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{userData.email}</p>
          <div className="inline-flex items-center gap-1 mt-2 bg-slate-800 border border-slate-700 px-2 py-1 rounded-md">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">ID:</span>
            <span className="text-xs font-mono text-purple-300">{userData.uid.substring(0, 8)}...</span>
          </div>
        </div>
      </div>

      {userData.email === "firefree60510@gmail.com" && (
        <button 
          onClick={() => navigate('admin')}
          className="w-full mb-6 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 transition-colors rounded-2xl p-4 flex items-center justify-center gap-2 font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)]"
        >
          <Crown className="w-5 h-5" /> Admin Panel
        </button>
      )}

      <div className="glass-card rounded-2xl p-4 mb-6 border-purple-500/20">
        <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Change Password
        </h3>
        
        {showPasswordChange ? (
          <div className="mt-4 space-y-3">
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordChange(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-sm font-medium rounded-xl transition-colors"
                disabled={resettingPwd}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resettingPwd || newPassword.length < 6}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {resettingPwd ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">Update your account password. You may be asked to log in again.</p>
            <button
              onClick={() => setShowPasswordChange(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Create New Password
            </button>
          </>
        )}
      </div>

      <div className="space-y-2 mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3">Account</h3>
        
        <button 
          onClick={() => navigate('withdraw')}
          className="w-full glass-card hover:bg-slate-800 transition-colors rounded-2xl p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-medium">Withdraw Coins</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>

      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-3">Support & Legal</h3>
        
        <button 
          onClick={handleContactUs}
          className="w-full glass-card hover:bg-slate-800 transition-colors rounded-2xl p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-300">Contact Us</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>

        <button 
          onClick={() => setShowPrivacy(true)}
          className="w-full glass-card hover:bg-slate-800 transition-colors rounded-2xl p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-300">Privacy Policy</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>

        <button 
          onClick={() => setShowFeedback(true)}
          className="w-full glass-card hover:bg-slate-800 transition-colors rounded-2xl p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-300">Send Feedback</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full mt-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold"
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>

      {/* Modals */}
      {showFeedback && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">Send Feedback</h3>
              <button onClick={() => setShowFeedback(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Tell us what you think..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-purple-500 outline-none min-h-[120px] mb-4"
            />
            <button
              onClick={submitFeedback}
              disabled={submittingFeedback}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {submittingFeedback ? 'Sending...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-lg text-white">Privacy Policy</h3>
              <button onClick={() => setShowPrivacy(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{config.privacyPolicy}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
