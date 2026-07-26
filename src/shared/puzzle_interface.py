"""
CodeArcade — Shared Puzzle Interface
======================================

Single-session puzzles (Maze Runner, Word Search, Sliding Puzzle) implement
this interface. Unlike turn-based games, puzzles are solved in one continuous
session rather than discrete moves, so they don't fit the game_interface.

Methods:
    generate(params)   — Generate a new puzzle with the given parameters.
    get_state()        — Return the current puzzle state as a dict.
    check_complete()   — Return True if the puzzle is solved.
"""


class PuzzleInterface:
    """Base class for all CodeArcade single-session puzzles."""

    def generate(self, params=None):
        """Generate a new puzzle. Override in subclass."""
        raise NotImplementedError

    def get_state(self):
        """Return current puzzle state as a dict. Override in subclass."""
        raise NotImplementedError

    def check_complete(self):
        """Return True if the puzzle has been solved. Override in subclass."""
        raise NotImplementedError
