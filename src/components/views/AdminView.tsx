import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, updateDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ArrowLeft, Check, X, Search, Settings, Users, CreditCard, MessageSquare, Loader2, Save } from "lucide-react";
import { format } from "date-fns";

export function AdminView({ navigate }: { navigate: (tab: any) => void }) {
  const [adminTab, setAdminTab] = useState<"withdrawals" | "users" | "settings" | "feedbacks">("withdrawals");

  return (
    <div className="flex-1 w-full bg-slate-950 text-white flex flex-col h-full absolute inset-0 z-[100] pb-safe max-h-[100dvh]">
      <div className="flex items-center p-4 pt-8 border-b border-slate-800 bg-slate-900 shrink-0">
        <button onClick={() => navigate('settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold ml-2">Admin Panel</h1>
      </div>
      
      <div className="flex overflow-x-auto shrink-0 border-b border-slate-800 bg-slate-900/50 p-2 gap-2 hide-scrollbar">
        {(["withdrawals", "users", "feedbacks", "settings"] as const).map(t => (
          <button
            key={t}
            onClick={() => setAdminTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              adminTab === t ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
        {adminTab === "withdrawals" && <WithdrawalsAdmin />}
        {adminTab === "users" && <UsersAdmin />}
        {adminTab === "feedbacks" && <FeedbacksAdmin />}
        {adminTab === "settings" && <SettingsAdmin />}
      </div>
    </div>
  );
}

function WithdrawalsAdmin() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReqs = async () => {
    setLoading(true);
    const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setReqs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchReqs(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, "withdrawals", id), { status: newStatus });
    fetchReqs();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500"/></div>;

  return (
    <div className="space-y-4">
      {reqs.map((r) => (
        <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded text-slate-300">
                  {r.method}
                </span>
              </div>
              <div className="mt-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Payment Details</p>
                <p className="font-mono text-sm text-green-400 break-all select-all">{r.details || "No details provided"}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">User: {r.userEmail}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{r.amount}</p>
              <p className="text-[10px] text-slate-500 uppercase">Coins</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
              r.status === 'completed' ? 'bg-green-500/10 text-green-500' :
              'bg-red-500/10 text-red-500'
            }`}>
              {r.status.toUpperCase()}
            </span>
            {r.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => updateStatus(r.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><X className="w-4 h-4"/></button>
                <button onClick={() => updateStatus(r.id, 'completed')} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"><Check className="w-4 h-4"/></button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-3">{format(r.createdAt, "PP p")}</p>
        </div>
      ))}
      {reqs.length === 0 && <p className="text-center text-slate-500">No withdrawal requests</p>}
    </div>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingCoins, setEditingCoins] = useState<{uid: string, coins: number} | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleUpdateCoins = async () => {
    if (!editingCoins) return;
    try {
      await updateDoc(doc(db, "users", editingCoins.uid), { coins: editingCoins.coins });
      setEditingCoins(null);
      fetchUsers();
      alert("Coins updated successfully!");
    } catch {
      alert("Error updating coins");
    }
  };

  const filtered = users.filter(u => 
    (u.email || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.uid || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search by email, name or UID" 
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-purple-500/50 text-sm"
        />
      </div>
      {loading ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500"/></div> : (
        <div className="space-y-3">
          {filtered.map(u => (
            <div key={u.uid} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <img src={u.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed="+u.uid} alt="" className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{u.name}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate mt-1">ID: {u.uid}</p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="font-bold text-green-400">{u.coins} 💰</p>
                  <p className="text-[10px] text-slate-500 mt-1">Ref: {u.referralCode}</p>
                </div>
                <button 
                  onClick={() => setEditingCoins({ uid: u.uid, coins: u.coins || 0 })}
                  className="bg-purple-600/20 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-600/30 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCoins && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Update Coins</h3>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 ml-1">Coins Amount</label>
              <input 
                type="number" 
                value={editingCoins.coins} 
                onChange={e => setEditingCoins({...editingCoins, coins: parseInt(e.target.value) || 0})}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingCoins(null)}
                className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateCoins}
                className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-500 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbacksAdmin() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchF = async () => {
      setLoading(true);
      const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchF();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500"/></div>;

  return (
    <div className="space-y-4">
      {feedbacks.map(f => (
        <div key={f.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-sm">{f.userEmail}</p>
              <p className="text-[10px] text-slate-500">{format(f.createdAt, "PP p")}</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800">{f.message}</p>
        </div>
      ))}
      {feedbacks.length === 0 && <p className="text-center text-slate-500">No feedbacks yet</p>}
    </div>
  );
}

function SettingsAdmin() {
  const [settings, setSettings] = useState({
    youtube: "",
    instagram: "",
    whatsapp: "",
    privacyPolicy: "",
    spinValues: "0, 5, 10, 15, 20"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchS = async () => {
      const docSnap = await getDoc(doc(db, "settings", "app_settings"));
      if (docSnap.exists()) {
        const d = docSnap.data();
        setSettings({
          youtube: d.youtube || "",
          instagram: d.instagram || "",
          whatsapp: d.whatsapp || "",
          privacyPolicy: d.privacyPolicy || "",
          spinValues: d.spinValues ? d.spinValues.join(", ") : "0, 5, 10, 15, 20"
        });
      }
      setLoading(false);
    };
    fetchS();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const parsedSpins = settings.spinValues.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    await setDoc(doc(db, "settings", "app_settings"), {
      ...settings,
      spinValues: parsedSpins.length > 0 ? parsedSpins : [0, 5, 10, 15, 20]
    }, { merge: true });
    setSaving(false);
    alert("Settings saved successfully!");
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500"/></div>;

  return (
    <div className="space-y-4 pb-12">
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 ml-1">YouTube Link</label>
          <input type="text" value={settings.youtube} onChange={e => setSettings({...settings, youtube: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 ml-1">Instagram Link</label>
          <input type="text" value={settings.instagram} onChange={e => setSettings({...settings, instagram: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 ml-1">WhatsApp phone number (e.g. 919876543210)</label>
          <input type="text" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 ml-1">Spin Wheel Values (Comma separated integers)</label>
          <input type="text" value={settings.spinValues} onChange={e => setSettings({...settings, spinValues: e.target.value})} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 ml-1">Privacy Policy</label>
          <textarea value={settings.privacyPolicy} onChange={e => setSettings({...settings, privacyPolicy: e.target.value})} rows={8} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none" />
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Settings
        </button>
      </div>
    </div>
  );
}
