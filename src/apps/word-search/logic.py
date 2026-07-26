"""
Word Search — CodeArcade Kids
================================
Theme-based word search puzzle. Implements the shared PuzzleInterface.

Key concepts: 2D grid word placement (horizontal, vertical, diagonal),
random letter fill, word-finding validation, set-based found tracking.
"""

import random
import string

WORD_LISTS = {
    'animals':   ['CAT', 'DOG', 'LION', 'BEAR', 'FISH', 'BIRD', 'WOLF', 'FROG'],
    'space':     ['MOON', 'STAR', 'MARS', 'ORBIT', 'COMET', 'NEBULA', 'SATURN'],
    'dinosaurs': ['REX', 'RAPTOR', 'STEGO', 'TREX', 'DINO', 'FOSSIL', 'CLAW'],
}

GRID_SIZE = 12  # 12×12


class WordSearch:
    """
    Generates a word search grid and validates player-found words.
    Words are placed horizontally, vertically, or diagonally.
    """

    DIRECTIONS = [
        (0, 1),   # right
        (1, 0),   # down
        (0, -1),  # left
        (-1, 0),  # up
        (1, 1),   # diagonal down-right
        (1, -1),  # diagonal down-left
        (-1, 1),  # diagonal up-right
        (-1, -1), # diagonal up-left
    ]

    def generate(self, params=None):
        params = params or {}
        theme = params.get('theme', 'animals')
        words = WORD_LISTS.get(theme, WORD_LISTS['animals'])[:6]

        self.theme = theme
        self.words = [w.upper() for w in words]
        self.grid = [['.' for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
        self.word_positions = {}  # word -> list of (row, col) cells
        self.found_words = set()

        # Place each word
        for word in self.words:
            self._place_word(word)

        # Fill remaining cells with random letters
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if self.grid[r][c] == '.':
                    self.grid[r][c] = random.choice(string.ascii_uppercase)

        return self.get_state()

    def _place_word(self, word, attempts=100):
        for _ in range(attempts):
            dr, dc = random.choice(self.DIRECTIONS)
            row = random.randint(0, GRID_SIZE - 1)
            col = random.randint(0, GRID_SIZE - 1)
            cells = []
            valid = True
            for i, ch in enumerate(word):
                r, c = row + dr * i, col + dc * i
                if not (0 <= r < GRID_SIZE and 0 <= c < GRID_SIZE):
                    valid = False
                    break
                existing = self.grid[r][c]
                if existing != '.' and existing != ch:
                    valid = False
                    break
                cells.append((r, c))
            if valid:
                for (r, c), ch in zip(cells, word):
                    self.grid[r][c] = ch
                self.word_positions[word] = cells
                return
        # If placement fails after many attempts, skip this word
        self.words = [w for w in self.words if w != word]

    def get_state(self):
        return {
            'grid': self.grid,
            'grid_size': GRID_SIZE,
            'words': self.words,
            'found_words': list(self.found_words),
            'theme': self.theme,
            'complete': self.check_complete(),
        }

    def check_word(self, cells):
        """
        Validate a selection of cells. If it matches a word, mark as found.
        cells — list of [row, col] pairs.
        Returns updated state.
        """
        # Extract letters
        letters = ''.join(self.grid[r][c] for r, c in cells)
        reverse = letters[::-1]
        for word in self.words:
            if word not in self.found_words:
                if letters == word or reverse == word:
                    self.found_words.add(word)
                    break
        return self.get_state()

    def check_complete(self):
        return len(self.found_words) == len(self.words)

    def get_word_positions(self):
        """Return word positions for highlighting (called when puzzle is complete)."""
        return {w: cells for w, cells in self.word_positions.items()}
