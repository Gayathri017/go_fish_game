import random

# -------------------------
# Card Class
# -------------------------
class Card:
    def __init__(self, rank, suit):
        self.rank = rank
        self.suit = suit

    def __repr__(self):
        return f"{self.rank} of {self.suit}"


# -------------------------
# Deck Class
# -------------------------
class Deck:
    suits = ["Hearts", "Diamonds", "Clubs", "Spades"]
    ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

    def __init__(self):
        self.cards = [Card(rank, suit) for suit in self.suits for rank in self.ranks]
        random.shuffle(self.cards)

    def draw(self):
        if self.cards:
            return self.cards.pop()
        return None


# -------------------------
# Player Class
# -------------------------
class Player:
    def __init__(self, name, is_ai=False):
        self.name = name
        self.hand = []
        self.books = []
        self.is_ai = is_ai

    def draw_card(self, deck):
        card = deck.draw()
        if card:
            self.hand.append(card)

    def check_books(self):
        ranks = [c.rank for c in self.hand]
        for rank in set(ranks):
            if ranks.count(rank) == 4:
                self.books.append(rank)
                self.hand = [c for c in self.hand if c.rank != rank]

    def ask_for_rank(self, other_players):
        if self.is_ai:
            # AI logic: pick random rank from hand
            if self.hand:
                return random.choice(self.hand).rank, random.choice(other_players)
        else:
            # Human will be handled in main.py
            return None, None


# -------------------------
# Game Class
# -------------------------
class Game:
    def __init__(self, player_names):
        self.deck = Deck()
        self.players = [Player(name, is_ai=("AI" in name)) for name in player_names]
        self.current_player_index = 0
        self.game_over = False

        # Deal 5 cards to each player
        for _ in range(5):
            for player in self.players:
                player.draw_card(self.deck)

    def next_turn(self):
        player = self.players[self.current_player_index]
        self.current_player_index = (self.current_player_index + 1) % len(self.players)
        return player

    def check_winner(self):
        all_books = sum([len(p.books) for p in self.players])
        if all_books >= 13:  # 52 cards / 4 per book
            self.game_over = True
            max_books = max(len(p.books) for p in self.players)
            winners = [p.name for p in self.players if len(p.books) == max_books]
            return winners
        return None