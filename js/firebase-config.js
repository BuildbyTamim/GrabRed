// js/firebase-config.js

// === ধাপ ১: Firebase ফাংশন ইম্পোর্ট করা ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js"; 

// === ধাপ ২: আপনার Firebase কনফিগারেশন ===

// দয়া করে Firebase থেকে পাওয়া আপনার কোডটি এখানে পেস্ট করুন
// অথবা শুধু "YOUR_API_KEY_HERE" লেখাগুলো পরিবর্তন করুন।
const firebaseConfig = {
  apiKey: "AIzaSyAKQ6jt1AEi9KxA72neWaPweLxkL4mwZng",
  authDomain: "grabred-65fc3.firebaseapp.com",
  projectId: "grabred-65fc3",
  storageBucket: "grabred-65fc3.firebasestorage.app",
  messagingSenderId: "376068405927",
  appId: "1:376068405927:web:582de9604d9d1d2b1b3982",
};
// === ধাপ ৩: Firebase চালু করা ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Auth সার্ভিস চালু করা

// === ধাপ ৪: db (ডেটাবেস) এবং auth (লগইন) এক্সপোর্ট করা ===
export { db, auth };