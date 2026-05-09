import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/Toast";
import { Wallet, ArrowUpRight, History, CreditCard, Landmark, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { format } from "date-fns";

type Method = "UPI" | "Paytm" | "PhonePe" | "Google Play";

export function WithdrawView({ navigate }: { navigate: (tab: any) => void }) {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [method, setMethod] = useState<Method>("UPI");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (userData) {
      loadHistory();
    }
  }, [userData]);

  const loadHistory = async () => {
    if (!userData) return;
    try {
      const q = query(
        collection(db, "withdrawals"), 
        where("uid", "==", userData.uid),
      );
      // Not using orderBy initially to avoid requiring a composite index immediately. 
      // In production, an index should be created and orderBy added.
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client-side sort fallback
      data.sort((a: any, b: any) => b.createdAt - a.createdAt);
      setHistory(data);
    } catch (e) {
      console.error("Error loading history", e);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    const withdrawAmount = parseInt(amount);
    if (isNaN(withdrawAmount)) {
      toast("Please select or enter an amount", "warning");
      return;
    }
    if (method !== "Google Play" && withdrawAmount < 100) {
      toast("Minimum withdrawal is 100 coins", "warning");
      return;
    }

    if (withdrawAmount > userData.coins) {
      toast("Insufficient coins balance", "error");
      return;
    }

    if (!details.trim()) {
      toast(`Please enter your ${method} details`, "warning");
      return;
    }

    setLoading(true);
    try {
      // Create withdrawal request
      await addDoc(collection(db, "withdrawals"), {
        uid: userData.uid,
        amount: withdrawAmount,
        method,
        details,
        status: "pending",
        createdAt: Date.now()
      });

      // Deduct coins
      await updateDoc(doc(db, "users", userData.uid), {
        coins: userData.coins - withdrawAmount
      });

      await refreshUserData();
      setAmount("");
      setDetails("");
      toast("Withdrawal request submitted successfully!", "success");
      loadHistory();
    } catch (e) {
      toast("Withdrawal failed. Please try again.", "error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return null;

  return (
    <div className="flex-1 pb-24 w-full px-4 pt-6">
      
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('settings')} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Withdraw Coins</h2>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[28px] p-6 mb-6 border border-slate-700 shadow-xl relative overflow-hidden">
        <p className="text-slate-400 text-sm mb-1 font-medium">Available Balance</p>
        <div className="flex items-end gap-2 text-white">
          <span className="text-4xl font-black">{userData.coins}</span>
          <span className="text-lg mb-1 opacity-80">Coins</span>
        </div>
        
        {/* Decorative subtle pattern */}
        <div className="absolute right-0 bottom-0 opacity-[0.03] transform translate-x-1/4 translate-y-1/4">
          <Wallet className="w-48 h-48" />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4 ml-1">Request Payout</h3>
        
        <div className="glass-card rounded-3xl p-5">
          <form onSubmit={handleWithdraw} className="space-y-5">
            
            {/* Method selection */}
            <div>
              <label className="text-xs text-slate-400 font-medium ml-1">Select Method</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(["UPI", "Paytm", "PhonePe", "Google Play"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMethod(m);
                      setAmount("");
                    }}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      method === m 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                      : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div>
              <label className="text-xs text-slate-400 font-medium ml-1">
                {method === "Google Play" ? "Email for Redeem Code" : `${method} ID / Number`}
              </label>
              <input
                type={method === "Google Play" ? "email" : "text"}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={method === "Google Play" ? "Enter your email address" : `Enter your ${method} details`}
                className="w-full mt-2 bg-slate-950/50 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm"
              />
            </div>

            {/* Amount */}
            {method === "Google Play" ? (
              <div>
                <label className="text-xs text-slate-400 font-medium ml-1">Select Redeem Code Amount</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { rs: 10, coins: 1000 },
                    { rs: 30, coins: 3000 },
                    { rs: 50, coins: 5000 },
                    { rs: 100, coins: 10000 }
                  ].map((opt) => (
                    <button
                      key={opt.rs}
                      type="button"
                      onClick={() => setAmount(opt.coins.toString())}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center border transition-all ${
                        amount === opt.coins.toString()
                        ? 'bg-green-500/10 border-green-500/50 text-green-400'
                        : 'bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="font-bold">₹{opt.rs} Code</span>
                      <span className="text-[10px] mt-1 opacity-80">{opt.coins.toLocaleString()} Coins</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-end">
                  <label className="text-xs text-slate-400 font-medium ml-1">Coins to withdraw</label>
                  <span className="text-xs text-slate-500">Min: 100</span>
                </div>
                <div className="relative mt-2">
                  <input
                    type="number"
                    required
                    min="100"
                    max={userData.coins}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 px-4 pl-10 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm font-medium"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">💰</span>
                  <button
                    type="button"
                    onClick={() => setAmount(userData.coins.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400 uppercase bg-purple-500/10 px-2 py-1 rounded"
                  >
                    Max
                  </button>
                </div>
                
                {/* Conversion rate preview */}
                {amount && !isNaN(parseInt(amount)) && (
                  <p className="text-xs text-green-400 mt-2 ml-1">
                    You will receive approximately ₹{(parseInt(amount) / 100).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-[0.98] mt-2 flex justify-center"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Submit Request"
              )}
            </button>
          </form>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
          <History className="w-4 h-4" /> Recent Withdrawals
        </h3>
        
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No withdrawal history found.
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {item.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                     item.status === 'rejected' ? <Wallet className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{item.method} Transfer</h4>
                    <p className="text-xs text-slate-400">{format(item.createdAt, 'MMM dd, h:mm a')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white mb-0.5">{item.amount} <span className="text-xs font-normal text-slate-400">Coins</span></p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'completed' ? 'text-green-400' :
                    item.status === 'rejected' ? 'text-red-400' :
                    'text-orange-400'
                  }`}>
                    {item.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
