// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserRole } from '@/lib/firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isClient: boolean | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isClient: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkClientStatus = async (userId: string) => {
    try {
      const clientsRef = collection(db, 'clients');
      const clientQuery = query(clientsRef, where('user_id', '==', userId));
      const clientSnapshot = await getDocs(clientQuery);
      return !clientSnapshot.empty;
    } catch (error) {
      console.error("Error checking client status:", error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        try {
          // Fetch user role from Firestore
          const role = await getUserRole(authUser.email!);
          setUserRole(role);
          
          // Check if the user exists in clients collection
          if (role === 'client') {
            const clientStatus = await checkClientStatus(authUser.uid);
            setIsClient(clientStatus);
          } else {
            setIsClient(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserRole(null);
          setIsClient(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setIsClient(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, isClient, loading }}>
      {children}
    </AuthContext.Provider>
  );
};