import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface UserData {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  coins: number;
  earnings: number;
  referralCode: string;
  referredBy: string | null;
  streak: number;
  lastClaim: number | null;
  lastAdWatch: number | null;
  spinsToday: number;
  lastSpinDate: number | null;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Capture referral code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("referralCode", ref);
    }
  }, []);

  const fetchUserData = async (currentUser: User) => {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      setUserData(userDoc.data() as UserData);
    } else {
      // Create new user profile if it doesn't exist
      let startCoins = 0;
      let referredByUid = null;
      
      const hasRegisteredBefore = localStorage.getItem("deviceRegistered");
      const refCode = localStorage.getItem("referralCode");

      // Prevent abuse: only process referral if not registered on this device before
      if (refCode && !hasRegisteredBefore) {
        const q = query(collection(db, "users"), where("referralCode", "==", refCode));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          // Prevent self-referral (though technically uid is new, but just in case)
          if (referrerDoc.id !== currentUser.uid) {
            referredByUid = referrerDoc.id;
            startCoins = 50; // New user bonus
            
            // Give 100 coins to referrer
            const referrerData = referrerDoc.data() as UserData;
            await updateDoc(doc(db, "users", referrerDoc.id), {
              coins: (referrerData.coins || 0) + 100,
              earnings: (referrerData.earnings || 0) + 100
            });
          }
        }
      }

      // Mark device as registered to prevent fake multi-account farming
      localStorage.setItem("deviceRegistered", "true");
      // Remove referral code so it's not reused
      localStorage.removeItem("referralCode");

      const newUser: UserData = {
        uid: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || "User",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email || 'U'}&background=random`,
        coins: startCoins,
        earnings: startCoins,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referredBy: referredByUid,
        streak: 0,
        lastClaim: null,
        lastAdWatch: null,
        spinsToday: 0,
        lastSpinDate: null,
        createdAt: Date.now(),
      };
      
      await setDoc(userDocRef, newUser);
      setUserData(newUser);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
