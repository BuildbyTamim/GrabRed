// js/auth.js

import { auth } from './firebase-config.js';
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

/**
 * এটি Authentication সিস্টেম চালু করে।
 */
function initializeAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // ব্যবহারকারী লগইন করা আছে (বেনামীভাবে)
            const uid = user.uid;
            localStorage.setItem('grabRedUserId', uid);
            console.log("Anonymous User Logged In, UID:", uid);

            // *** সমাধান: "authReady" নামে একটি সংকেত পাঠানো হচ্ছে ***
            // এটি home.js এবং অন্যান্য ফাইলকে জানাবে যে লগইন সম্পন্ন হয়েছে
            document.dispatchEvent(new Event('authReady'));

        } else {
            // ব্যবহারকারী লগইন করা নেই, নতুন করে লগইন করানো হচ্ছে
            console.log("No user found. Signing in anonymously...");
            signInAnonymously(auth).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
            });
        }
    });
}

// সাইট লোড হলেই এই ফাংশনটি চালু করা
initializeAuth();