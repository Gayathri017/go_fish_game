let currentRoom = 'default';
let selectedRank = null;

async function initGame(mode) {
    if (mode === 'family') {
        currentRoom = document.getElementById('room-name').value || 'family1';
    }
    
    const res = await fetch('/join', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom })
    });
    const state = await res.json();
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    renderUI(state);
}

function renderUI(state) {
    const pHand = document.getElementById('player-area');
    const oHand = document.getElementById('opponent-area');
    
    pHand.innerHTML = '';
    state.playerHand.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<span>${card.rank}</span><span>${card.suit}</span>`;
        div.onclick = () => {
            selectedRank = card.rank;
            document.getElementById('ask-btn').disabled = false;
            document.getElementById('status-msg').innerText = "Asking for: " + card.rank;
        };
        pHand.appendChild(div);
    });

    oHand.innerHTML = '';
    for(let i=0; i<state.opponentCardCount; i++) {
        const div = document.createElement('div');
        div.className = 'card back';
        oHand.appendChild(div);
    }

    document.getElementById('p-books').innerText = state.playerBooks;
    document.getElementById('a-books').innerText = state.aiBooks;
    document.getElementById('deck-size').innerText = state.deckCount;
}

async function performAsk() {
    const res = await fetch('/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom, rank: selectedRank })
    });
    const data = await res.json();
    document.getElementById('status-msg').innerText = data.message;
    renderUI(data.state);
}