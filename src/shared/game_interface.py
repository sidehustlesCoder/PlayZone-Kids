"""
CodeArcade — Shared Game Interface
===================================

All game apps in CodeArcade implement this interface, ensuring consistent
state management and allowing the dashboard to render any game with the
same wrapper component.

Methods:
    new_game(config)   — Initialize a new game with optional configuration.
    get_state()        — Return the current game state as a dict.
    make_move(input)   — Process a player action, return the updated state.
    is_game_over()     — Return True if the game has ended.
    get_result()       — Return the game result (win/loss/draw + stats).
"""


class GameInterface:
    """Base class for all CodeArcade games."""

    def new_game(self, config=None):
        """Initialize a new game. Override in subclass."""
        raise NotImplementedError

    def get_state(self):
        """Return current game state as a dict. Override in subclass."""
        raise NotImplementedError

    def make_move(self, player_input):
        """Process a player action. Override in subclass."""
        raise NotImplementedError

    def is_game_over(self):
        """Return True if the game has ended. Override in subclass."""
        raise NotImplementedError

    def get_result(self):
        """Return game result dict with keys like 'winner', 'score', etc."""
        raise NotImplementedError
