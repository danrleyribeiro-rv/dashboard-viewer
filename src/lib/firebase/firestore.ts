// src/lib/firebase/firestore.ts
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    addDoc,
    updateDoc,
    Timestamp,
    type DocumentData,
    limit
  } from 'firebase/firestore';
  import { db } from './config';
  
  export interface UserData {
    email: string;
    role: string;
    created_at: Timestamp;
    updated_at: Timestamp;
  }
  
  export interface ClientData {
    name: string;
    email: string;
    document: string;
    phonenumber: string;
    address: string | null;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    segment: string;
    responsible_name: string;
    responsible_surname: string;
    manager_id: string;
    user_id: string;
    created_at: Timestamp;
    updated_at: Timestamp;
    deleted_at: Timestamp | null;
  }
  
  export interface Dashboard {
    id: string;
    name: string;
    iframe_url: string;
    user_id: string;
  }
  
  // User operations
  export const getUserByEmail = async (email: string): Promise<UserData | null> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return null;
      }
  
      return querySnapshot.docs[0].data() as UserData;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  };
  
  export const getUserRole = async (email: string): Promise<string | null> => {
    try {
      const userData = await getUserByEmail(email);
      return userData ? userData.role : null;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
    }
  };
  
  // Client operations
  export const getClientByUserId = async (userId: string): Promise<ClientData | null> => {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('user_id', '==', userId), limit(1));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return null;
      }
  
      return querySnapshot.docs[0].data() as ClientData;
    } catch (error) {
      console.error("Error getting client by user ID:", error);
      return null;
    }
  };
  
  export const getClientByEmail = async (email: string): Promise<ClientData | null> => {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return null;
      }
  
      return querySnapshot.docs[0].data() as ClientData;
    } catch (error) {
      console.error("Error getting client by email:", error);
      return null;
    }
  };
  
  export const isUserAuthorizedClient = async (userId: string, email: string): Promise<boolean> => {
    try {
      // Check if the user has client role
      const userData = await getUserByEmail(email);
      if (!userData || userData.role !== 'client') {
        return false;
      }
      
      // Check if the user exists in clients collection
      const client = await getClientByUserId(userId);
      return !!client;
    } catch (error) {
      console.error("Error checking client authorization:", error);
      return false;
    }
  };
  
  // Dashboard operations
  export const getDashboardsByUserId = async (userId: string): Promise<Dashboard[]> => {
    try {
      const dashboardsRef = collection(db, 'dashboards');
      const q = query(dashboardsRef, where('user_id', '==', userId), orderBy('name'));
      const querySnapshot = await getDocs(q);
  
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dashboard));
    } catch (error) {
      console.error("Error getting dashboards by user ID:", error);
      return [];
    }
  };
  
  // Usage data operations
  export const addUsageData = async (data: {
    user_id: string,
    dashboard_id: string,
    event_type: string,
    event_data: any,
    event_time: Date
  }) => {
    try {
      return await addDoc(collection(db, 'usage_data'), {
        ...data,
        event_time: Timestamp.fromDate(data.event_time)
      });
    } catch (error) {
      console.error("Error adding usage data:", error);
      throw error;
    }
  };
  
  // Access logs operations
  export const addAccessLog = async (data: {
    user_id: string,
    dashboard_id: string,
    duration: number,
    accessed_at: Date
  }) => {
    try {
      return await addDoc(collection(db, 'access_logs'), {
        ...data,
        accessed_at: Timestamp.fromDate(data.accessed_at)
      });
    } catch (error) {
      console.error("Error adding access log:", error);
      throw error;
    }
  };