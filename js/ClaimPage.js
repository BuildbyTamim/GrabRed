// js/ClaimPage.js

import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// DOM এলিমেন্টগুলো সিলেক্ট করা
const systemMessage = document.getElementById('system-message');
const redPacketCard = document.getElementById('red-packet-card'); // <-- মূল কার্ড
const claimStep1 = document.getElementById('claim-step-1');
const claimStep2 = document.getElementById('claim-step-2');
const senderInfo = document.getElementById('sender-info');
const message = document.getElementById('message');
const goButton = document.getElementById('go-button');
const tokenLogoResult = document.getElementById('token-logo-result');
const amountDisplay = document.getElementById('amount-display');
const finalMessage = document.getElementById('final-message');
const handpickedResult = document.getElementById('handpicked-result');
const creatorContactInfo = document.getElementById('creator-contact-info');
const submitAddressForm = document.getElementById('submit-address-form');
const evmAddressInput = document.getElementById('evm-address');
const codeclaimResult = document.getElementById('codeclaim-result');
const codeToCopy = document.getElementById('code-to-copy');
const copyCodeBtn = document.getElementById('copy-code-btn');

// *** নতুন: রিপোর্ট এলিমেন্ট ***
const creatorReport = document.getElementById('creator-report');
const reportList = document.getElementById('report-list');

let packetData = null; 
let packetId = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    packetId = params.get('id');
    
    // *** সমাধান: view=report চেক করা ***
    const viewMode = params.get('view'); 

    if (!packetId) {
        showSystemMessage("Error: No Red Packet ID found.");
        return;
    }
    
    // viewMode ভেরিয়েবলটি পাস করা
    loadPacketData(packetId, viewMode); 
});

/**
 * ফায়ারবেস থেকে প্যাকেট ডেটা লোড করে UI রেন্ডার করে
 */
async function loadPacketData(id, viewMode) {
    try {
        const docRef = doc(db, "redPackets", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            showSystemMessage("Sorry, this Red Packet does not exist.");
            return;
        }
        packetData = docSnap.data();

        // *** সমাধান: viewMode অনুযায়ী লজিক ভাগ করা ***
        if (viewMode === 'report') {
            // এটি Creator, তাকে রিপোর্ট দেখাও
            showCreatorReport(packetData);
        } else {
            // এটি Claimer, তাকে ক্লেইম করতে দাও
            const claimedDataStr = localStorage.getItem('claimed_' + packetId);
            if (claimedDataStr) {
                const claimedData = JSON.parse(claimedDataStr);
                showAlreadyClaimed(packetData, claimedData); // আগেই ক্লেইম করা
            } else {
                setupClaimStep1(packetData); // নতুন ক্লেইমার
            }
        }
        
        systemMessage.classList.add('hidden');
        redPacketCard.classList.remove('hidden');

    } catch (err) {
        console.error("Error loading packet:", err);
        showSystemMessage("Failed to load Red Packet. Please try again.");
    }
}


// -----------------------------------------------------------------
// --- CLAIMER LOGIC (ক্লেইম করার লজিক, অপরিবর্তিত) ---
// -----------------------------------------------------------------

function setupClaimStep1(packet) {
    message.textContent = packet.note || 'Best wishes!';
    if (packet.type === 'Handpicked') {
        senderInfo.textContent = packet.contactInfo || 'Anonymous Creator';
    } else if (packet.type === 'CodeClaim') {
        senderInfo.textContent = 'unknown user';
    }
    goButton.addEventListener('click', () => handleClaimAttempt());
}

async function handleClaimAttempt() {
    goButton.disabled = true;
    goButton.textContent = ''; 
    goButton.classList.add('spinning'); 
    redPacketCard.classList.add('step-2-active');

    const docRef = doc(db, "redPackets", packetId);
    const updatedDocSnap = await getDoc(docRef);
    if (!updatedDocSnap.exists()) {
        showSystemMessage("Error: Packet disappeared.");
        return;
    }
    packetData = updatedDocSnap.data(); 
    showTokenLogo(packetData.token);

    try {
        let claimedData = {}; 
        if (packetData.type === 'Handpicked') {
            const recipients = packetData.recipients || 1;
            const claimsSoFar = packetData.claims ? packetData.claims.length : 0;
            if (claimsSoFar >= recipients) {
                showSystemMessage("Sorry, this Red Packet is fully claimed.");
                return;
            }
            let amount = (packetData.totalAmount / packetData.recipients);
            const displayAmount = amount.toFixed(2); 
            claimedData = { type: 'handpicked', amount: displayAmount };
            
            claimStep1.classList.add('hidden');
            amountDisplay.textContent = `${displayAmount} ${packetData.token.toUpperCase()}`;
            creatorContactInfo.textContent = packetData.contactInfo || 'the creator';
            handpickedResult.classList.remove('hidden');
            claimStep2.classList.remove('hidden');
            submitAddressForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleAddressSubmit(packetId, claimedData);
            });
        } else if (packetData.type === 'CodeClaim') {
            const claimedCodes = packetData.claimedCodes || [];
            const allCodes = packetData.codes || [];
            const availableCode = allCodes.find(c => 
                !claimedCodes.some(claimed => claimed.code === c.code)
            );
            if (availableCode) {
                await updateDoc(docRef, {
                    claimedCodes: arrayUnion({ code: availableCode.code, claimedAt: new Date() })
                });
                claimedData = { type: 'code', code: availableCode.code, amount: availableCode.amount };
                claimStep1.classList.add('hidden');
                amountDisplay.textContent = `${availableCode.amount} ${packetData.token.toUpperCase()}`;
                codeToCopy.value = availableCode.code;
                codeclaimResult.classList.remove('hidden');
                claimStep2.classList.remove('hidden');
            } else {
                showSystemMessage("Sorry, this Red Packet is fully claimed.");
                return;
            }
        }
        localStorage.setItem('claimed_' + packetId, JSON.stringify(claimedData));
    } catch (err) {
        console.error("Error during claim:", err);
        claimStep1.classList.add('hidden');
        showSystemMessage("An error occurred during claim. Please try again.");
        goButton.classList.remove('spinning');
        goButton.textContent = 'GO';
        goButton.disabled = false;
    }
}

async function handleAddressSubmit(packetId, claimedData) {
    const address = evmAddressInput.value.trim();
    if (!address) {
        alert("Please enter your address or UID.");
        return;
    }
    try {
        const docRef = doc(db, "redPackets", packetId);
        await updateDoc(docRef, {
            claims: arrayUnion({ address: address, amount: claimedData.amount, claimedAt: new Date() })
        });
        handpickedResult.classList.add('hidden');
        finalMessage.textContent = "Your information has been submitted. Thank you!";
        finalMessage.classList.remove('hidden');
    } catch (err) {
        console.error("Error submitting address:", err);
        alert("Failed to submit address. Please try again.");
    }
}

function showAlreadyClaimed(packet, claimedData) {
    claimStep1.classList.add('hidden');
    redPacketCard.classList.add('step-2-active');
    showTokenLogo(packet.token);
    amountDisplay.textContent = `${claimedData.amount} ${packet.token.toUpperCase()}`;
    if (claimedData.type === 'handpicked') {
        handpickedResult.classList.add('hidden'); 
        finalMessage.textContent = "You have already claimed your spot.";
        finalMessage.classList.remove('hidden');
    } else if (claimedData.type === 'code') {
        codeToCopy.value = claimedData.code;
        codeclaimResult.classList.remove('hidden');
    }
    claimStep2.classList.remove('hidden');
}


// -----------------------------------------------------------------
// --- নতুন: CREATOR REPORT LOGIC ---
// -----------------------------------------------------------------

/**
 * Creator-কে ক্লেইমের রিপোর্ট দেখানোর ফাংশন
 */
function showCreatorReport(packet) {
    // ধাপ ১ (GO বাটন) হাইড করুন
    claimStep1.classList.add('hidden');
    
    // ধাপ ২ এর ডিজাইন দেখান
    claimStep2.classList.remove('hidden');
    redPacketCard.classList.add('step-2-active');
    
    // সব ক্লেইম ফর্ম হাইড করুন
    handpickedResult.classList.add('hidden');
    codeclaimResult.classList.add('hidden');
    finalMessage.classList.add('hidden');

    // রিপোর্ট সেকশনটি দেখান
    creatorReport.classList.remove('hidden');

    // টাইটেল এবং লোগো সেট করুন
    amountDisplay.textContent = `${packet.token.toUpperCase()} Report`;
    showTokenLogo(packet.token);

    // রিপোর্ট লিস্ট তৈরি করা
    reportList.innerHTML = ''; // পুরোনো লিস্ট খালি করা

    if (packet.type === 'Handpicked') {
        const claims = packet.claims || [];
        if (claims.length > 0) {
            claims.forEach(claim => {
                const entry = document.createElement('div');
                entry.className = 'report-entry';
                entry.innerHTML = `<strong>Address/UID:</strong> ${claim.address} <br> <strong>Amount:</strong> ${claim.amount}`;
                reportList.appendChild(entry);
            });
        } else {
            reportList.innerHTML = '<p style="color: white; text-align: center;">No one has submitted their address yet.</p>';
        }
    } else if (packet.type === 'CodeClaim') {
        const claims = packet.claimedCodes || [];
        if (claims.length > 0) {
            claims.forEach(claim => {
                const entry = document.createElement('div');
                entry.className = 'report-entry';
                // CodeClaim-এর জন্য কোন কোডটি ক্লেইম হয়েছে তা দেখানো
                const originalCode = packet.codes.find(c => c.code === claim.code);
                entry.innerHTML = `<strong>Code:</strong> ${claim.code} <br> <strong>Amount:</strong> ${originalCode.amount || 'N/A'}`;
                reportList.appendChild(entry);
            });
        } else {
            reportList.innerHTML = '<p style="color: white; text-align: center;">No codes have been claimed yet.</p>';
        }
    }
}


// -----------------------------------------------------------------
// --- Helper Functions (অপরিবর্তিত) ---
// -----------------------------------------------------------------

function showSystemMessage(msg) {
    redPacketCard.classList.add('hidden'); 
    systemMessage.innerHTML = `<p>${msg}</p>`;
    systemMessage.classList.remove('hidden');
}

copyCodeBtn.addEventListener('click', () => {
    codeToCopy.select();
    navigator.clipboard.writeText(codeToCopy.value);
    copyCodeBtn.textContent = 'Copied!';
});

function showTokenLogo(tokenName) {
    const lowerCaseTokenName = tokenName.toLowerCase();
    const tokenLogoMap = {
        "usdt": "images/usdt.png", "usdc": "images/usdc.png", "btc": "images/btc.png",
        "eth": "images/eth.png", "bnb": "images/bnb.png", "sol": "images/sol.png",
        "sui": "images/sui.png", "apt": "images/apt.png", "xrp": "images/xrp.png",
        "doge": "images/doge.png"
    };
    if (tokenLogoMap[lowerCaseTokenName]) {
        tokenLogoResult.innerHTML = `<img src="${tokenLogoMap[lowerCaseTokenName]}" alt="${tokenName}">`;
    } else {
        tokenLogoResult.innerHTML = `<div class="logo-placeholder">${tokenName.charAt(0).toUpperCase()}</div>`;
    }
}