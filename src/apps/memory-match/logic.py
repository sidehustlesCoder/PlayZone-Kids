"""
Memory Match — CodeArcade Kids
================================
Card-flip pairs game. Implements the shared GameInterface.

Key concepts: List shuffling (Fisher-Yates), state machines (covered/flipped/matched),
pair matching logic, move and time tracking.
"""

import random
import time

THEMES = {
    'animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸'],
    'shapes':  ['⭐', '❤️', '💎', '🔵', '🟡', '🟠', '🔺', '🟣', '🔷', '♦️', '🔶', '⬛'],
    'food':    ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍒', '🥑', '🌽', '🍕', '🎂'],
}

GRID_SIZES = {
    'easy':   8,   # 4x2  — 4 pairs
    'medium': 16,  # 4x4  — 8 pairs
    'hard':   24,  # 6x4  — 12 pairs
}


class MemoryMatch:
    """
    Memory Match game. Players flip two cards at a time trying to find pairs.
    State tracks which cards are matched/flipped and counts moves.
    """

    def new_game(self, config=None):
        config = config or {}
        difficulty = config.get('difficulty', 'medium')
        theme = config.get('theme', 'animals')

        num_cards = GRID_SIZES[difficulty]
        num_pairs = num_cards // 2
        emojis = THEMES.get(theme, THEMES['animals'])[:num_pairs]

        deck = emojis * 2
        random.shuffle(deck)

        self.cards = [
            {'id': i, 'emoji': emoji, 'flipped': False, 'matched': False}
            for i, emoji in enumerate(deck)
        ]
        self.flipped_ids = []   # IDs of currently face-up (unmatched) cards
        self.moves = 0
        self.matches = 0
        self.num_pairs = num_pairs
        self.start_time = time.time()
        self.end_time = None
        self.game_over_flag = False
        return self.get_state()

    def get_state(self):
        elapsed = int((self.end_time or time.time()) - self.start_time)
        return {
            'cards': self.cards,
            'flipped_ids': self.flipped_ids,
            'moves': self.moves,
            'matches': self.matches,
            'num_pairs': self.num_pairs,
            'elapsed': elapsed,
            'game_over': self.game_over_flag,
        }

    def make_move(self, card_id):
        """Flip a card. Returns updated state. Handles pair checking."""
        card_id = int(card_id)
        if self.game_over_flag:
            return self.get_state()

        card = self.cards[card_id]
        if card['matched'] or card['flipped'] or len(self.flipped_ids) >= 2:
            return self.get_state()

        # Flip card
        card['flipped'] = True
        self.flipped_ids.append(card_id)

        if len(self.flipped_ids) == 2:
            self.moves += 1
            id_a, id_b = self.flipped_ids
            if self.cards[id_a]['emoji'] == self.cards[id_b]['emoji']:
                # Match!
                self.cards[id_a]['matched'] = True
                self.cards[id_b]['matched'] = True
                self.matches += 1
                self.flipped_ids = []
                if self.matches == self.num_pairs:
                    self.game_over_flag = True
                    self.end_time = time.time()
            # If no match, the UI should call reset_flipped after a short delay

        return self.get_state()

    def reset_flipped(self):
        """Called by the UI after showing the non-matching pair briefly."""
        for cid in self.flipped_ids:
            self.cards[cid]['flipped'] = False
        self.flipped_ids = []
        return self.get_state()

    def is_game_over(self):
        return self.game_over_flag

    def get_result(self):
        elapsed = int((self.end_time or time.time()) - self.start_time)
        return {
            'moves': self.moves,
            'time': elapsed,
            'won': self.game_over_flag,
        }
