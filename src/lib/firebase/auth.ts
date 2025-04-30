// src/lib/firebase/auth.ts
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    confirmPasswordReset,
    onAuthStateChanged,
    type User
  } from 'firebase/auth';
  import { auth } from './config';
  
  export const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };
  
  export const signUp = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };
  
  export const signOut = async () => {
    return firebaseSignOut(auth);
  };
  
  export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };
  
  export const confirmResetPassword = async (oobCode: string, newPassword: string) => {
    return confirmPasswordReset(auth, oobCode, newPassword);
  };
  
  export const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  };