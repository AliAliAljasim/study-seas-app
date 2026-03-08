import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const USERS_KEY = 'local_users';
const SESSION_KEY = 'local_session';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((session) => {
      if (session) setUser(JSON.parse(session));
    }).finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users: (User & { password: string })[] = raw ? JSON.parse(raw) : [];
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw { code: 'auth/invalid-credential' };
    const { password: _, ...userObj } = found;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
    setUser(userObj);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users: (User & { password: string })[] = raw ? JSON.parse(raw) : [];
    if (users.find((u) => u.email === email)) throw { code: 'auth/email-already-in-use' };
    const newUser = { uid: Date.now().toString(), email, displayName: name, password };
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { password: _, ...userObj } = newUser;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
    setUser(userObj);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
