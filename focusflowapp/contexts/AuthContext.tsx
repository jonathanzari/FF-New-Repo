"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

import { getAuth, onAuthStateChanged, User, signOut, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, 
verifyBeforeUpdateEmail, ActionCodeSettings, fetchSignInMethodsForEmail} from 'firebase/auth';

import { auth, app, db } from '@/lib/firebase'; 

import { type AppSettings } from '@/settings-page';

import { doc, getDoc } from 'firebase/firestore';


export interface UserProfile {
  username?: string;
  email?: string;
  photoURL?: string;
  interests?: string[];
  education?: string[];
}

/*

Page is pretty much done

*/

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUserEmail: (password: string, newEmail: string) => Promise<void>;
  userSettings: AppSettings | null;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | null>(null);


interface AuthProviderProps {
  children: ReactNode;
}


export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<AppSettings | null>(null);


  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const [profileSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, "users", currentUser.uid)),
          getDoc(doc(db, "settings", currentUser.uid)) 
        ]);
        
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data() as UserProfile);
        }
        if (settingsSnap.exists()) {
          setUserSettings(settingsSnap.data() as AppSettings);
        }
      } else {
        setUserProfile(null);
        setUserSettings(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => {
    const auth = getAuth(app);
    return signOut(auth);
  };

  const forgotPassword = (email: string) => {
    const auth = getAuth(app);
    return sendPasswordResetEmail(auth, email);
  };


  const updateUserEmail = async(password:string, newEmail: string) => {
    console.log("Email change process STARTED."); 
    const user = auth.currentUser;

    if (!user || !user.email)
    {
      throw new Error("No user is currently signed in.");
    }

    const signInMethods = await fetchSignInMethodsForEmail(auth, newEmail);
    

    console.log(`Checking if '${newEmail}' is taken. Methods found:`, signInMethods);

    if (signInMethods.length > 0) {
      throw { code: 'auth/email-already-in-use' };
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    const actionCodeSettings: ActionCodeSettings = {
      url: `${window.location.origin}/profile`,
      handleCodeInApp: true,
    };

    await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings);
  };


  const value = { user, loading, logout, forgotPassword, setUser, updateUserEmail, userSettings, userProfile };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}