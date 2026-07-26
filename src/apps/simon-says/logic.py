"""
Simon Says — CodeArcade Kids
==============================
Color sequence memory game. Implements the shared GameInterface.

Key concepts: Random sequence generation, list prefix matching,
growing challenge (sequence extends by one each round), state machine.
"""

import random


class SimonSays:
    """
    Simon Says game. Each round the computer shows a sequence that grows
    by one. The player must repeat the entire sequence from memory.
    """

    COLORS = ['red', 'blue', 'green', 'yellow']

    def new_game(self, config=None):
        self.sequence = []
        self.player_input = []
        self.round = 0
        self.longest_streak = 0
        self.game_over_flag = False
        self.phase = 'watch'   # 'watch' | 'input'
        self._add_step()
        return self.get_state()

    def _add_step(self):
        self.sequence.append(random.choice(self.COLORS))
        self.round += 1
        self.player_input = []
        self.phase = 'watch'

    def get_state(self):
        return {
            'sequence': self.sequence,
            'player_input': self.player_input,
            'round': self.round,
            'longest_streak': self.longest_streak,
            'game_over': self.game_over_flag,
            'phase': self.phase,
            'expected_length': len(self.sequence),
        }

    def make_move(self, color):
        """Player taps a color. Returns updated state."""
        if self.game_over_flag or self.phase != 'input':
            return self.get_state()

        color = str(color).lower().strip()
        self.player_input.append(color)
        idx = len(self.player_input) - 1

        # Check if this press matches the sequence so far
        if color != self.sequence[idx]:
            self.game_over_flag = True
            return self.get_state()

        # Correct so far — have they completed the full sequence?
        if len(self.player_input) == len(self.sequence):
            if len(self.sequence) > self.longest_streak:
                self.longest_streak = len(self.sequence)
            self._add_step()   # Extend and start next round

        return self.get_state()

    def start_input_phase(self):
        """Called by the UI after showing the sequence animation."""
        self.phase = 'input'
        self.player_input = []
        return self.get_state()

    def is_game_over(self):
        return self.game_over_flag

    def get_result(self):
        return {
            'rounds_completed': self.round - 1,
            'longest_streak': self.longest_streak,
        }
