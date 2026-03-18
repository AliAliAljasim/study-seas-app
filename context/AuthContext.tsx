import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  reload,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  emailVerified: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendVerification: () => Promise<void>;
  reloadUser: () => Promise<boolean>; // returns true if now verified
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  emailVerified: false,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  sendVerification: async () => {},
  reloadUser: async () => false,
});

function toUser(u: FirebaseUser): User {
  return {
    uid: u.uid,
    email: u.email ?? '',
    displayName: u.displayName ?? u.email ?? '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? toUser(u) : null);
      setEmailVerified(u?.emailVerified ?? false);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Send verification separately so a failure here doesn't block account creation.
    // The verify-email screen will offer a resend button as fallback.
    try {
      await sendEmailVerification(cred.user);
    } catch (_) {}
    setUser(toUser({ ...cred.user, displayName: name }));
    setEmailVerified(false);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const sendVerification = async () => {
    if (!auth.currentUser) throw new Error('No user signed in');
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) return; // already verified, no need to send
    await sendEmailVerification(auth.currentUser);
  };

  const reloadUser = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    return verified;
  };

  return (
    <AuthContext.Provider value={{ user, emailVerified, loading, signIn, signUp, signOut, sendVerification, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
