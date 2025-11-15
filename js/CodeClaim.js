// js/CodeClaim.js

// === ফায়ারবেস ইম্পোর্ট করা ===
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// === সমাধান: 'authReady' (লগইন সম্পন্ন) ইভেন্টের জন্য অপেক্ষা করা ===
document.addEventListener('authReady', () => {

    // --- DOM এলিমেন্টগুলো সিলেক্ট করা ---
    const form = document.getElementById('create-packet-form');
    const generateBtn = document.getElementById('generate-btn');
    
    const tokenSelect = document.getElementById('token-select');
    const totalAmountInput = document.getElementById('total-amount');
    const tokenSymbolSuffix = document.getElementById('token-symbol-suffix');
    const tokenLogoImg = document.getElementById('token-logo-img');

    const addCodeBtn = document.getElementById('add-code-btn'); 
    const packetCodeInput = document.getElementById('packet-code-input');
    const packetAmountInput = document.getElementById('packet-amount-input');
    const codeListArea = document.getElementById('code-list-area');

    const successMessageCard = document.getElementById('success-message');
    const generatedLinkInput = document.getElementById('generated-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');

    // --- স্টেট ভেরিয়েবল ---
    let addedCodes = []; 
    const tokenLogoMap = {
        "usdt": "images/usdt.png", "usdc": "images/usdc.png", "btc": "images/btc.png",
        "eth": "images/eth.png", "bnb": "images/bnb.png", "sol": "images/sol.png",
        "sui": "images/sui.png", "apt": "images/apt.png", "xrp": "images/xrp.png",
        "doge": "images/doge.png"
    };

    // --- কোড তালিকা রেন্ডার করার ফাংশন ---
    function renderCodeList() {
        codeListArea.innerHTML = ''; 
        if (addedCodes.length === 0) {
            codeListArea.innerHTML = '<p class="code-list-placeholder">No codes added yet.</p>';
            return;
        }
        const selectedTokenSymbol = tokenSelect.options[tokenSelect.selectedIndex].text || '';
        addedCodes.forEach((item, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'code-entry';
            entryDiv.innerHTML = `
                <span>
                    <strong>${item.code}</strong> (${item.amount} ${selectedTokenSymbol})
                </span>
                <button type="button" class="remove-code-btn" data-index="${index}" title="Remove code">&times;</button>
            `;
            codeListArea.appendChild(entryDiv);
        });
    }

    // --- মূল ফর্ম ভ্যালিডেশন ---
    function validateMainForm() {
        const tokenSelected = tokenSelect.value !== "";
        const codesAdded = addedCodes.length > 0;
        generateBtn.disabled = !(tokenSelected && codesAdded);
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
        renderCodeList();
        validateMainForm();
    });

    totalAmountInput.addEventListener('input', validateMainForm);

    // --- "Add" বাটন ইভেন্ট ---
    addCodeBtn.addEventListener('click', function() {
        const code = packetCodeInput.value.trim();
        const amount = parseFloat(packetAmountInput.value);

        if (code && amount > 0) {
            addedCodes.push({ code: code, amount: amount });
            renderCodeList();
            packetCodeInput.value = '';
            packetAmountInput.value = '';
            packetCodeInput.focus();
            validateMainForm();
        } else {
            alert("Please enter a valid code and an amount greater than zero.");
        }
    });

    // --- "Remove" বাটন ইভেন্ট ---
    codeListArea.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-code-btn')) {
            const indexToRemove = parseInt(event.target.dataset.index);
            addedCodes.splice(indexToRemove, 1);
            renderCodeList();
            validateMainForm();
        }
    });

    // === "Generate" বাটন (ফায়ারবেস কোড) ===
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        // ১. ফর্ম থেকে সব ডেটা সংগ্রহ করা
        const packetData = {
            token: tokenSelect.value,
            totalAmountRef: parseFloat(totalAmountInput.value) || 0, 
            note: document.getElementById('note').value || 'Best wishes',

            // *** সমাধান: লগইন সম্পন্ন হওয়ার পর ID নেওয়া হচ্ছে ***
            creatorId: localStorage.getItem('grabRedUserId'), 

            type: "CodeClaim",
            createdAt: serverTimestamp(),
            codes: addedCodes,
            claimedCodes: []
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

    // --- ইনিশিয়াল লোড ---
    renderCodeList();
    validateMainForm(); 
});