"""
Hangman — CodeArcade
======================
Pure Python logic for the Hangman word-guessing game.
Implements the shared GameInterface.

Key concepts: Set operations for letter tracking, state machines,
word-list management, difficulty-based word selection.
"""

import random

WORDS = {
    'easy': [
        'cat', 'dog', 'sun', 'hat', 'box', 'car', 'cup', 'pen', 'map', 'key',
        'ball', 'fish', 'tree', 'book', 'cake', 'door', 'fire', 'gold', 'hand', 'lamp',
    ],
    'medium': [
        'python', 'castle', 'bridge', 'rocket', 'pencil', 'turtle', 'rabbit', 'mirror',
        'jacket', 'planet', 'garden', 'magnet', 'window', 'silver', 'basket', 'temple',
        'candle', 'forest', 'island', 'butter',
    ],
    'hard': [
        'algorithm', 'javascript', 'hypothesis', 'quadrant', 'labyrinth', 'trajectory',
        'complexity', 'encryption', 'byzantium', 'quasar', 'phosphorus', 'archipelago',
        'chrysalis', 'epiphany', 'kaleidoscope', 'metamorphosis', 'cryptography',
        'photosynthesis', 'phenomenon', 'equilibrium',
    ],
}

MAX_WRONG = {
    'easy': 8,
    'medium': 7,
    'hard': 6,
}


class Hangman:
    """
    Hangman game. The player guesses letters one at a time.
    State includes the display word (with blanks), wrong guesses,
    and remaining attempts.
    """

    def new_game(self, config=None):
        config = config or {}
        difficulty = config.get('difficulty', 'medium')
        self.difficulty = difficulty
        self.word = random.choice(WORDS[difficulty]).upper()
        self.guessed_letters = set()
        self.wrong_guesses = []
        self.max_wrong = MAX_WRONG[difficulty]
        self.game_over_flag = False
        self.won_flag = False
        return self.get_state()

    def get_state(self):
        display = [c if c in self.guessed_letters else '_' for c in self.word]
        return {
            'display': display,
            'word': self.word if self.game_over_flag else None,  # reveal only at game over
            'guessed_letters': sorted(list(self.guessed_letters)),
            'wrong_guesses': self.wrong_guesses,
            'wrong_count': len(self.wrong_guesses),
            'max_wrong': self.max_wrong,
            'difficulty': self.difficulty,
            'game_over': self.game_over_flag,
            'won': self.won_flag,
        }

    def make_move(self, letter):
        """Guess a letter. Returns updated state."""
        if self.game_over_flag:
            return self.get_state()

        letter = str(letter).upper().strip()
        if not letter or len(letter) != 1 or not letter.isalpha():
            return self.get_state()
        if letter in self.guessed_letters:
            return self.get_state()  # Already guessed

        self.guessed_letters.add(letter)
        if letter not in self.word:
            self.wrong_guesses.append(letter)

        # Check win/loss
        if all(c in self.guessed_letters for c in self.word):
            self.game_over_flag = True
            self.won_flag = True
        elif len(self.wrong_guesses) >= self.max_wrong:
            self.game_over_flag = True
            self.won_flag = False

        return self.get_state()

    def is_game_over(self):
        return self.game_over_flag

    def get_result(self):
        return {
            'won': self.won_flag,
            'word': self.word,
            'wrong_guesses': self.wrong_guesses,
            'total_guesses': len(self.guessed_letters),
        }
