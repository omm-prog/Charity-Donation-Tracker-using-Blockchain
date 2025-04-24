import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { auth, db } from "./firebaseConfig";

async function storeNGOWallet(walletAddress) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // 🔥 Agar user already exist karta hai toh sirf walletAddress update karo
    await setDoc(userRef, { walletAddress }, { merge: true });
  } else {
    // 🔥 Agar NGO ka account pehli baar ban raha hai toh pura data store karo
    await setDoc(userRef, {
      name: user.displayName || "Unknown NGO",
      email: user.email,
      role: "ngo",
      walletAddress: walletAddress,
    });
  }

  console.log("✅ NGO wallet stored in Firestore:", walletAddress);
}

export { storeNGOWallet };
