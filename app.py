from flask import Flask, render_template, jsonify, request
import random
from collections import Counter

app = Flask(__name__)

# Game Engine Logic
class GoFishEngine:
    def __init__(self, mode="solo"):
        self.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        self.suits = ['♠', '♥', '♦', '♣']
        self.deck = [{"rank": r, "suit": s} for r in self.ranks for s in self.suits]
        random.shuffle(self.deck)
        self.players = {
            "Player": {"hand": [], "books": 0},
            "Computer": {"hand": [], "books": 0}
        }
        self.deal()

    def deal(self):
        for _ in range(7):
            for p in self.players:
                if self.deck: self.players[p]["hand"].append(self.deck.pop())

    def get_state(self):
        return {
            "playerHand": self.players["Player"]["hand"],
            "opponentCardCount": len(self.players["Computer"]["hand"]),
            "playerBooks": self.players["Player"]["books"],
            "aiBooks": self.players["Computer"]["books"],
            "deckCount": len(self.deck)
        }

# Store active games by Room ID
active_games = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/join', methods=['POST'])
def join():
    data = request.json
    room_id = data.get('room_id', 'default')
    if room_id not in active_games:
        active_games[room_id] = GoFishEngine()
    return jsonify(active_games[room_id].get_state())

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    room_id = data.get('room_id', 'default')
    rank = data.get('rank')
    game = active_games.get(room_id)
    
    # Logic for giving cards
    target_hand = game.players["Computer"]["hand"]
    matches = [c for c in target_hand if c['rank'] == rank]
    
    if matches:
        game.players["Player"]["hand"].extend(matches)
        game.players["Computer"]["hand"] = [c for c in target_hand if c['rank'] != rank]
        return jsonify({"message": f"Got {len(matches)} {rank}s!", "state": game.get_state(), "goFish": False})
    
    # Go Fish logic
    if game.deck:
        drawn = game.deck.pop()
        game.players["Player"]["hand"].append(drawn)
        return jsonify({"message": f"Go Fish! You drew {drawn['rank']}", "state": game.get_state(), "goFish": True})
    
    return jsonify({"message": "Ocean empty!", "state": game.get_state(), "goFish": True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)