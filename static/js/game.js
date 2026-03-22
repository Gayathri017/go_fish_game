let myName = "", currentRoom = "", selectedRank = null, pollInterval = null, aiThinking = false;

/**
 * START SOLO MODE: Auto-adds "Computer" and starts immediately.
 */
async function startSolo() {
    myName = "Player";
    currentRoom = "solo_" + Math.random().toString(36).substring(7);
    
    // Add You
    await fetch('/join', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom, username: myName }) });
    
    // Add AI
    await fetch('/join', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom, username: "Computer" }) });
    
    // Start Game
    await fetch('/start', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom }) });
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    pollInterval = setInterval(updateGameState, 2000);
}

/**
 * JOIN FAMILY MODE: Waits for others in the lobby.
 */
async function joinGame() {
    myName = document.getElementById('username').value.trim();
    currentRoom = document.getElementById('room-id').value.trim();
    if(!myName || !currentRoom) return alert("Please enter Name and Room!");
    
    await fetch('/join', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom, username: myName }) });

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('waiting-screen').style.display = 'block';
    document.getElementById('display-room').innerText = currentRoom;
    pollInterval = setInterval(updateGameState, 2000);
}

async function triggerStart() {
    await fetch('/start', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom }) });
}

/**
 * THE HEARTBEAT: Checks the server for updates.
 */
async function updateGameState() {
    const res = await fetch('/join', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom, username: myName }) });
    const state = await res.json();

    if (state.gameOver) {
        clearInterval(pollInterval);
        showVictory(state);
        return;
    }

    if (state.gameStarted) {
        // NEW LOGIC: If it's my turn but I have no cards and deck is empty, skip me
        if (state.currentTurn === myName && state.yourHand.length === 0 && state.deckCount === 0) {
            console.log("No cards left, skipping turn...");
            // We'll call a simple 'ask' with a dummy rank to force a turn change
            await fetch('/ask', { method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ room_id: currentRoom, username: myName, target_player: Object.keys(state.others)[0], rank: 'SKIP' }) });
            return;
        }

        document.getElementById('waiting-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        renderUI(state);
        
        if (state.currentTurn === "Computer" && !aiThinking) {
            aiThinking = true;
            setTimeout(handleAI, 2000);
        }
    }
}

async function handleAI() {
    const res = await fetch('/ai-move', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom }) });
    const data = await res.json();
    
    if(data.message) {
        const msgBox = document.getElementById('status-msg');
        msgBox.innerText = data.message;
        msgBox.style.color = "#ffd700"; // Highlight AI move in gold
    }
    aiThinking = false;
}

/**
 * THE RENDERER: Draws the board.
 */
function renderUI(state) {
    document.getElementById('deck-size').innerText = state.deckCount;
    document.getElementById('p-books').innerText = state.yourBooks;
    
    const isMyTurn = state.currentTurn === myName;
    const turnIndicator = document.getElementById('turn-indicator');
    turnIndicator.innerText = isMyTurn ? "★ YOUR TURN ★" : `WAITING FOR ${state.currentTurn}`;

    // Render Your Cards
    const pArea = document.getElementById('player-area');
    pArea.innerHTML = '';
    state.yourHand.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card';
        if (card.suit === '♥' || card.suit === '♦') div.style.color = 'red';
        div.innerHTML = `<span>${card.rank}</span><span>${card.suit}</span>`;
        div.onclick = () => { 
            if(isMyTurn) { 
                selectedRank = card.rank; 
                document.querySelectorAll('.card').forEach(c => c.style.border = 'none');
                div.style.border = '3px solid #ffd700';
                document.getElementById('ask-btn').disabled = false; 
            }
        };
        pArea.appendChild(div);
    });

    // Handle Opponents & Target Box
    const oppContainer = document.getElementById('opponents-container');
    const select = document.getElementById('target-player-select');
    oppContainer.innerHTML = ''; 
    select.innerHTML = '';

    const opponentNames = Object.keys(state.others);

    if (opponentNames.length === 1) {
        // SOLO: Hide box, auto-select Computer
        select.style.display = "none";
        select.innerHTML = `<option value="${opponentNames[0]}" selected></option>`;
    } else {
        // MULTIPLAYER: Show box
        select.style.display = "inline-block";
        select.innerHTML = '<option value="">Ask Who?</option>';
    }

    opponentNames.forEach(name => {
        const info = state.others[name];
        oppContainer.innerHTML += `<div class="opponent-slot ${state.currentTurn === name ? 'active-turn' : ''}">${name}<br>Books: ${info.books} | Cards: ${info.cards}</div>`;
        if (opponentNames.length > 1) select.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

/**
 * THE ACTION: Sending your move to Python.
 */
async function performAsk() {
    const target = document.getElementById('target-player-select').value;
    if(!target || !selectedRank) return;

    const res = await fetch('/ask', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ room_id: currentRoom, username: myName, target_player: target, rank: selectedRank }) });
    const data = await res.json();
    
    const msgBox = document.getElementById('status-msg');
    msgBox.innerText = data.message;
    msgBox.style.color = "white"; 
    document.getElementById('ask-btn').disabled = true;
}

/**
 * THE FINALE: Show the results.
 */
function showVictory(state) {
    let winner = "You";
    let maxBooks = state.yourBooks;

    for(const [name, info] of Object.entries(state.others)) {
        if(info.books > maxBooks) {
            maxBooks = info.books;
            winner = name;
        }
    }

    document.getElementById('game-screen').innerHTML = `
        <div class="container victory-screen">
            <h1>🏆 ${winner === "You" ? "VICTORY!" : winner + " WINS!"} 🏆</h1>
            <p>Final Score: ${maxBooks} Books</p>
            <button onclick="location.reload()" class="play-again-btn">PLAY AGAIN</button>
        </div>
    `;
}