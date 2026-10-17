import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  reload,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { formatAuthError } from '../lib/authErrors';

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<User>;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  formatAuthError: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmail = async (name: string, email: string, pass: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateProfile(cred.user, {
        displayName: name.trim(),
      });
    }
    await sendEmailVerification(cred.user);
    await reload(cred.user);
    setCurrentUser(auth.currentUser);
    return cred.user;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return cred.user;
  };

  const loginWithGoogle = async (): Promise<User> => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const handleSendResetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in to send verification email.');
    }
    await sendEmailVerification(auth.currentUser);
  };

  const refreshUser = async (): Promise<User | null> => {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    const updatedUser = auth.currentUser;
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    sendResetPasswordEmail: handleSendResetPassword,
    resendVerificationEmail,
    refreshUser,
    formatAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
