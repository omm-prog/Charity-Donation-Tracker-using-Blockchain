import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const syncNGOProfiles = async () => {
  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // For each user with a wallet address
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (userData.walletAddress) {
        // Create or update document in ngoProfiles collection
        await setDoc(doc(db, 'ngoProfiles', userData.walletAddress), {
          name: userData.name || 'Unknown NGO',
          email: userDoc.id, // Using document ID as email since it's the email in users collection
          walletAddress: userData.walletAddress,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    console.log('NGO profiles sync completed');
  } catch (error) {
    console.error('Error syncing NGO profiles:', error);
    throw error;
  }
}; 