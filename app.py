from flask import Flask, render_template, jsonify, request
import random
from collections import Counter

app = Flask(__name__)

# --- Game Engine Classes ---

class Card:
    def __init__(self, rank, suit):
        self.rank = rank
        self.suit = suit
    def to_dict(self):
        return {"rank": self.rank, "suit": self.suit}

class GoFishEngine:
    def __init__(self):
        self.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        self.suits = ['♠', '♥', '♦', '♣']
        self.deck = [Card(r, s) for r in self.ranks for s in self.suits]
        random.shuffle(self.deck)
        
        self.players = {
            "Player": {"hand": [], "books": 0},
            "Computer": {"hand": [], "books": 0}
        }
        self.ai_memory = set() # Ranks the AI knows you have
        self.deal()

    def deal(self):
        for _ in range(7):
            for p in self.players:
                self.players[p]["hand"].append(self.deck.pop())

    def check_books(self, name):
        hand = self.players[name]["hand"]
        counts = Counter(c.rank for c in hand)
        for rank, count in counts.items():
            if count == 4:
                self.players[name]["books"] += 1
                self.players[name]["hand"] = [c for c in hand if c.rank != rank]
                self.refill_if_empty(name)

    def refill_if_empty(self, name):
        if not self.players[name]["hand"] and self.deck:
            for _ in range(min(7, len(self.deck))):
                self.players[name]["hand"].append(self.deck.pop())

    def get_state(self):
        return {
            "playerHand": [c.to_dict() for c in self.players["Player"]["hand"]],
            "opponentCardCount": len(self.players["Computer"]["hand"]),
            "playerBooks": self.players["Player"]["books"],
            "aiBooks": self.players["Computer"]["books"]
        }

# Initialize Global Game
game = GoFishEngine()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    rank = data.get('rank')
    
    # 1. Update AI memory (AI now knows you have this rank)
    game.ai_memory.add(rank)
    
    # 2. Check Computer's hand
    matches = [c for c in game.players["Computer"]["hand"] if c.rank == rank]
    
    if matches:
        game.players["Player"]["hand"].extend(matches)
        game.players["Computer"]["hand"] = [c for c in game.players["Computer"]["hand"] if c.rank != rank]
        game.check_books("Player")
        game.refill_if_empty("Computer")
        return jsonify({"message": f"Success! You took {len(matches)} {rank}(s).", "newState": game.get_state(), "goFish": False})
    
    # 3. Go Fish
    if game.deck:
        drawn = game.deck.pop()
        game.players["Player"]["hand"].append(drawn)
        game.check_books("Player")
        msg = f"Go Fish! You drew a {drawn.rank}{drawn.suit}."
        lucky = (drawn.rank == rank)
        return jsonify({"message": msg, "newState": game.get_state(), "goFish": not lucky})
    
    return jsonify({"message": "Ocean is empty!", "newState": game.get_state(), "goFish": True})

@app.route('/ai-move')
def ai_move():
    hand = game.players["Computer"]["hand"]
    if not hand: return jsonify({"message": "AI has no cards!", "newState": game.get_state()})

    # SMART AI LOGIC: Check memory first
    my_ranks = [c.rank for c in hand]
    overlap = [r for r in my_ranks if r in game.ai_memory]
    
    rank_to_ask = random.choice(overlap) if overlap else random.choice(my_ranks)
    
    # Check Player's hand
    matches = [c for c in game.players["Player"]["hand"] if c.rank == rank_to_ask]
    
    if matches:
        game.players["Computer"]["hand"].extend(matches)
        game.players["Player"]["hand"] = [c for c in game.players["Player"]["hand"] if c.rank != rank_to_ask]
        game.check_books("Computer")
        game.refill_if_empty("Player")
        return jsonify({"message": f"AI took your {rank_to_ask}s!", "newState": game.get_state()})
    
    # AI Go Fish
    if game.deck:
        game.players["Computer"]["hand"].append(game.deck.pop())
        game.check_books("Computer")
    
    return jsonify({"message": f"AI asked for {rank_to_ask} but had to Go Fish.", "newState": game.get_state()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0') # host 0.0.0.0 allows phone access