import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Profile {
  email: string;
  name: string;
}

const STORAGE_KEY = "pastel-finance:profile";

interface ProfileContextValue {
  profile: Profile | null;
  ready: boolean;
  saveProfile: (p: Profile) => void;
  signOut: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw) as Profile);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const saveProfile = useCallback((p: Profile) => {
    setProfile(p);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }, []);

  const signOut = useCallback(() => {
    setProfile(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ profile, ready, saveProfile, signOut }),
    [profile, ready, saveProfile, signOut],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
