import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface AppConfig {
  youtube: string;
  instagram: string;
  whatsapp: string;
  privacyPolicy: string;
  spinValues: number[];
}

const defaultConfig: AppConfig = {
  youtube: "https://youtube.com",
  instagram: "https://instagram.com",
  whatsapp: "910000000000",
  privacyPolicy: "This is the default privacy policy. Update it in the admin panel.",
  spinValues: [0, 5, 10, 15, 20]
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'app_settings');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig({
          youtube: data.youtube ?? defaultConfig.youtube,
          instagram: data.instagram ?? defaultConfig.instagram,
          whatsapp: data.whatsapp ?? defaultConfig.whatsapp,
          privacyPolicy: data.privacyPolicy ?? defaultConfig.privacyPolicy,
          spinValues: data.spinValues ?? defaultConfig.spinValues,
        });
      } else {
        setDoc(docRef, defaultConfig);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { config, loading };
}
