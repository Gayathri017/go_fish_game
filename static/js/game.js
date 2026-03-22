// Game State
let selectedRank = null;
let gameState = {
    playerHand: [],
    opponentCardCount: 0,
    playerBooks: 0,
    aiBooks: 0,
    isPlayerTurn: true
};

// 1. Render the Player's Hand
function updateUI(data) {
    const handContainer = document.getElementById('player-hand');
    handContainer.innerHTML = ''; // Clear current hand

    data.playerHand.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${['♥', '♦'].includes(card.suit) ? 'red' : ''}`;
        cardDiv.onclick = () => selectCard(card.rank, cardDiv);
        
        cardDiv.innerHTML = `
            <span>${card.rank}${card.suit}</span>
            <span style="align-self:center; font-size: 2em;">${card.suit}</span>
            <span style="align-self:flex-end; transform:rotate(180deg)">${card.rank}${card.suit}</span>
        `;
        handContainer.appendChild(cardDiv);
    });

    // Update AI Hand (Hidden cards)
    const oppHand = document.getElementById('opponent-hand');
    oppHand.innerHTML = '';
    for(let i=0; i < data.opponentCardCount; i++) {
        const back = document.createElement('div');
        back.className = 'card';
        back.style.background = 'repeating-linear-gradient(45deg, #b71c1c, #b71c1c 10px, #801313 10px, #801313 20px)';
        oppHand.appendChild(back);
    }

    // Update Stats
    document.getElementById('books-count').innerText = `You: ${data.playerBooks} | AI: ${data.aiBooks}`;
}

// 2. Handle Selecting a Card to Ask
function selectCard(rank, element) {
    selectedRank = rank;
    // Remove highlight from others
    document.querySelectorAll('.card').forEach(c => c.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.3)");
    document.querySelectorAll('.card').forEach(c => c.style.borderColor = "#ccc");
    
    // Highlight selected
    element.style.boxShadow = "0 0 15px #ffd54f";
    element.style.borderColor = "#ffd54f";
}

// 3. The "Ask" Action (Communication with Python Backend)
async function askForCard() {
    if (!selectedRank) {
        logMessage("⚠️ Select a card from your hand first!");
        return;
    }

    const response = await fetch('/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ rank: selectedRank, target: 'Computer' })
    });

    const result = await response.json();
    logMessage(result.message);
    
    // Update local state and UI
    updateUI(result.newState);

    if (result.goFish) {
        // Trigger a slight delay for AI turn if user fished
        setTimeout(aiTurn, 2000);
    }
}

// 4. Helper to Log Game Events
function logMessage(msg) {
    const log = document.getElementById('game-log');
    const entry = document.createElement('div');
    entry.innerText = `> ${msg}`;
    log.prepend(entry); // Newest messages at the top
}

async function aiTurn() {
    logMessage("🤖 AI is thinking...");
    const response = await fetch('/ai-move');
    const result = await response.json();
    
    setTimeout(() => {
        logMessage(result.message);
        updateUI(result.newState);
    }, 1500);
}