// js/home.js

import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/**
 * ফায়ারবেস থেকে *শুধুমাত্র* এই ইউজারের History লোড করে
 */
async function loadHistory(userId) {
    const historyContent = document.querySelector('.history-content');
    historyContent.innerHTML = '<p class="loading-text">Loading your history...</p>';

    try {
        // "redPackets" কালেকশনকে ফিল্টার করা
        const q = query(
            collection(db, "redPackets"), 
            where("creatorId", "==", userId), 
            orderBy("createdAt", "desc"), 
            limit(20)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyContent.innerHTML = '<p class="loading-text">You have not created any RedPackets yet.</p>';
            return;
        }

        historyContent.innerHTML = ''; // লিস্ট খালি করা

        querySnapshot.forEach((doc) => {
            const packet = doc.data(); 
            const packetId = doc.id; 

            // --- গণনা লজিক (অপরিবর্তিত) ---
            let totalClaims = 0;
            let claimedCount = 0;
            let remainingClaims = 0;
            let statusText = '';
            let statusClass = ''; 

            if (packet.type === 'Handpicked') {
                totalClaims = packet.recipients || 1;
                claimedCount = packet.claims ? packet.claims.length : 0;
            } else if (packet.type === 'CodeClaim') {
                totalClaims = packet.codes ? packet.codes.length : 0;
                claimedCount = packet.claimedCodes ? packet.claimedCodes.length : 0;
            }
            remainingClaims = totalClaims - claimedCount;

            if (claimedCount === 0) {
                statusText = 'Not Claimed Yet';
                statusClass = 'status-not-claimed';
            } else if (remainingClaims > 0) {
                statusText = 'Claiming in Progress';
                statusClass = 'status-in-progress';
            } else {
                statusText = 'All Claimed';
                statusClass = 'status-all-claimed';
            }
            // --- গণনা লজিক শেষ ---

            const historyCard = document.createElement('div');
            historyCard.className = 'history-card';
            
            historyCard.innerHTML = `
                <div class="card-left">
                    <span class="history-type">${packet.type || 'N/A'}</span>
                    <span class="history-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-middle">
                    <span class="remaining-count">${remainingClaims}</span>
                    <span class="remaining-label">claims remaining</span>
                </div>
                <div class="card-right">
                    <a href="ClaimPage.html?id=${packetId}&view=report" class="btn-view" target="_blank">View</a>
                </div>
            `;
            
            historyContent.appendChild(historyCard);
        });

    } catch (error) {
        console.error("Error loading history: ", error);
        
        if (error.code === 'failed-precondition') {
            historyContent.innerHTML = '<p class="loading-text error">Error: Database query failed. You may need to create a Firestore Index.</p>';
            console.error("FIREBASE INDEXING ERROR: You need to create an index for 'redPackets' on 'creatorId' (ascending) and 'createdAt' (descending). Check the console for a link to create it.");
        } else {
            historyContent.innerHTML = '<p class="loading-text error">Failed to load history. Please try again.</p>';
        }
    }
}

// === পেজ লোড হওয়ার লজিক (আপডেটেড) ===
// DOMContentLoaded এর বদলে authReady ইভেন্টের জন্য অপেক্ষা করা
document.addEventListener('authReady', () => {
    console.log("Auth is ready, loading history...");
    const currentUserId = localStorage.getItem('grabRedUserId');

    if (currentUserId) {
        loadHistory(currentUserId);
    } else {
        console.error("Auth was ready, but no User ID found in localStorage.");
    }
});