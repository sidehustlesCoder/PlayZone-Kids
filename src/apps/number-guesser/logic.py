"""
Number Guessing Game — CodeArcade
===================================
Pure Python logic for the number guessing game.
Implements the shared GameInterface.

Key concepts: Random number generation, state management, difficulty levels.
"""

import random


class NumberGuesser:
    """Number guessing game with configurable difficulty."""

    def new_game(self, config=None):
        config = config or {}
        self.min_val = config.get('min', 1)
        self.max_val = config.get('max', 100)
        difficulty = config.get('difficulty', 'medium')
        self.max_attempts = {'easy': 15, 'medium': 10, 'hard': 5}.get(difficulty, 10)
        self.target = random.randint(self.min_val, self.max_val)
        self.attempts = 0
        self.guesses = []
        self.won = False
        return self.get_state()

    def get_state(self):
        return {
            'min': self.min_val,
            'max': self.max_val,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'guesses': self.guesses,
            'won': self.won,
            'game_over': self.is_game_over(),
        }

    def make_move(self, guess):
        if self.is_game_over():
            return self.get_state()
        guess = int(guess)
        self.attempts += 1
        hint = 'correct' if guess == self.target else ('higher' if guess < self.target else 'lower')
        self.guesses.append({'guess': guess, 'hint': hint})
        if guess == self.target:
            self.won = True
        return self.get_state()

    def is_game_over(self):
        return self.won or self.attempts >= self.max_attempts

    def get_result(self):
        return {
            'won': self.won,
            'target': self.target,
            'attempts': self.attempts,
        }
