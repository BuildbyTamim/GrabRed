// js/Handpicked.js

// === ফায়ারবেস ইম্পোর্ট করা ===
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// === সমাধান: 'authReady' (লগইন সম্পন্ন) ইভেন্টের জন্য অপেক্ষা করা ===
document.addEventListener('authReady', () => {
    
    // লগইন সম্পন্ন হওয়ার পর DOM এলিমেন্টগুলো সিলেক্ট করা
    const form = document.getElementById('create-packet-form');
    const tokenSelect = document.getElementById('token-select');
    const totalAmountInput = document.getElementById('total-amount');
    const recipientCountInput = document.getElementById('recipient-count');
    const generateBtn = document.getElementById('generate-btn');
    
    const tokenSymbolSuffix = document.getElementById('token-symbol-suffix');
    const tokenLogoImg = document.getElementById('token-logo-img'); 
    
    const successMessageCard = document.getElementById('success-message');
    const generatedLinkInput = document.getElementById('generated-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');

    // টোকেন লোগো ম্যাপ
    const tokenLogoMap = {
        "usdt": "images/usdt.png", "usdc": "images/usdc.png", "btc": "images/btc.png",
        "eth": "images/eth.png", "bnb": "images/bnb.png", "sol": "images/sol.png",
        "sui": "images/sui.png", "apt": "images/apt.png", "xrp": "images/xrp.png",
        "doge": "images/doge.png"
    };

    // --- ভ্যালিডেশন ফাংশন ---
    function validateForm() {
        const tokenSelected = tokenSelect.value !== "";
        const amountValid = parseFloat(totalAmountInput.value) > 0;
        const recipientsValid = parseInt(recipientCountInput.value) >= 1;

        generateBtn.disabled = !(tokenSelected && amountValid && recipientsValid);
    }

    // --- টোকেন চেঞ্জ ইভেন্ট ---
    tokenSelect.addEventListener('change', function() {
        const selectedToken = tokenSelect.value; 
        tokenSymbolSuffix.textContent = selectedToken.toUpperCase();
        
        const logoPath = tokenLogoMap[selectedToken];
        if (logoPath) {
            tokenLogoImg.src = logoPath;
            tokenLogoImg.alt = selectedToken.toUpperCase() + " Logo";
            tokenLogoImg.style.display = 'block'; 
        } else {
            tokenLogoImg.style.display = 'none'; 
        }
        validateForm();
    });

    // ইনপুট ভ্যালিডেশন
    totalAmountInput.addEventListener('input', validateForm);
    recipientCountInput.addEventListener('input', validateForm);

    // === "Generate" বাটন (ফায়ারবেস কোড) ===
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        // ১. ফর্ম থেকে সব ডেটা সংগ্রহ করা
        const packetData = {
            contactInfo: document.getElementById('contact-info').value,
            token: tokenSelect.value,
            totalAmount: parseFloat(totalAmountInput.value),
            recipients: parseInt(recipientCountInput.value),
            distributionType: document.querySelector('input[name="distribution"]:checked').value,
            note: document.getElementById('note').value || 'Best wishes',
            
            // *** সমাধান: লগইন সম্পন্ন হওয়ার পর ID নেওয়া হচ্ছে ***
            creatorId: localStorage.getItem('grabRedUserId'), 
            
            type: "Handpicked",
            createdAt: serverTimestamp(),
            claimedAmount: 0,
            claims: []
        };

        try {
            // ২. ফায়ারবেসের "redPackets" কালেকশনে ডেটা সেভ করা
            const docRef = await addDoc(collection(db, "redPackets"), packetData);

            // ৩. সেভ সফল হলে লিঙ্ক তৈরি করা
            const uniqueId = docRef.id;
            const shareableLink = `${window.location.origin}/ClaimPage.html?id=${uniqueId}`;
            
            // ৪. সাকসেস মেসেজ দেখানো
            form.style.display = 'none';
            generatedLinkInput.value = shareableLink;
            successMessageCard.style.display = 'block';
            window.scrollTo(0, 0);

        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Failed to generate RedPacket. Please check console for errors.");
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate';
        }
    });

    // --- কপি বাটন ---
    copyLinkBtn.addEventListener('click', function() {
        generatedLinkInput.select();
        navigator.clipboard.writeText(generatedLinkInput.value).then(() => {
            copyLinkBtn.textContent = 'Copied!';
            setTimeout(() => { copyLinkBtn.textContent = 'Copy'; }, 2000);
        });
    });

    // পেজ লোড হলে প্রাথমিক ভ্যালিডেশন
    validateForm();
});