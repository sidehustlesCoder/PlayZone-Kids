"""
Sliding Puzzle (15-Puzzle) — CodeArcade Kids
==============================================
Numbered tile sliding puzzle. Implements the shared PuzzleInterface.

Key concepts: Permutation parity (solvability check), blank-tile swapping,
Manhattan distance heuristic for move counting, win detection.

The 15-puzzle has 16 tiles (including one blank). A shuffle is solvable if
and only if: (number of inversions) + (blank's row from bottom) is even.
"""

import random


class SlidingPuzzle:
    """
    N×N sliding puzzle. Default is 4×4 (15-puzzle).
    Tiles are numbered 1..(N*N-1) plus a blank (0).
    """

    SIZES = {
        'easy':   3,   # 3×3 = 8-puzzle (simpler)
        'medium': 4,   # 4×4 = 15-puzzle (classic)
    }

    def generate(self, params=None):
        params = params or {}
        difficulty = params.get('difficulty', 'medium')
        self.n = self.SIZES.get(difficulty, 4)
        self.difficulty = difficulty
        self.moves_count = 0

        # Generate a solvable shuffle
        tiles = list(range(self.n * self.n))
        while True:
            random.shuffle(tiles)
            if self._is_solvable(tiles):
                break

        self.tiles = tiles
        self.blank_idx = tiles.index(0)
        self.complete_flag = False
        return self.get_state()

    def _is_solvable(self, tiles):
        """
        Check if the puzzle configuration is solvable.
        A permutation is solvable when:
            inversions + blank_row_from_bottom is even (for even N)
            or just inversions is even (for odd N).
        """
        n = self.n
        inversions = 0
        flat = [t for t in tiles if t != 0]
        for i in range(len(flat)):
            for j in range(i + 1, len(flat)):
                if flat[i] > flat[j]:
                    inversions += 1

        blank_row_from_bottom = n - (tiles.index(0) // n)

        if n % 2 == 1:
            return inversions % 2 == 0
        else:
            return (inversions + blank_row_from_bottom) % 2 == 0

    def get_state(self):
        return {
            'tiles': self.tiles,
            'n': self.n,
            'blank_idx': self.blank_idx,
            'moves': self.moves_count,
            'complete': self.complete_flag,
            'difficulty': self.difficulty,
        }

    def move_tile(self, tile_idx):
        """
        Attempt to slide the tile at tile_idx into the blank space.
        Only valid if the tile is adjacent (up/down/left/right) to the blank.
        """
        if self.complete_flag:
            return self.get_state()

        tile_idx = int(tile_idx)
        bi = self.blank_idx
        n = self.n
        br, bc = divmod(bi, n)
        tr, tc = divmod(tile_idx, n)

        # Must be adjacent (one step away, not diagonal)
        if abs(tr - br) + abs(tc - bc) != 1:
            return self.get_state()

        # Swap tile and blank
        self.tiles[bi], self.tiles[tile_idx] = self.tiles[tile_idx], self.tiles[bi]
        self.blank_idx = tile_idx
        self.moves_count += 1

        if self._is_solved():
            self.complete_flag = True

        return self.get_state()

    def _is_solved(self):
        expected = list(range(1, self.n * self.n)) + [0]
        return self.tiles == expected

    def check_complete(self):
        return self.complete_flag
