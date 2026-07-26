"""
Connect Four — CodeArcade Kids
================================
Drop-and-stack grid game. Implements the shared GameInterface.

Key concepts: 2D grid manipulation, win detection (horizontal, vertical,
diagonal), simple heuristic AI, gravity simulation (pieces fall to bottom).
"""

import random

ROWS = 6
COLS = 7
WIN_LENGTH = 4


class ConnectFour:
    """
    Connect Four — players alternate dropping pieces into columns.
    Pieces fall to the lowest empty row. First to get 4 in a line wins.
    """

    def new_game(self, config=None):
        config = config or {}
        self.mode = config.get('mode', 'vs_ai')   # 'vs_ai' | '2player'
        self.grid = [[None] * COLS for _ in range(ROWS)]
        self.current_player = 1    # 1 = human/red, 2 = AI/yellow
        self.game_over_flag = False
        self.winner = None         # None | 1 | 2 | 'draw'
        self.winning_cells = []
        self.last_col = None
        return self.get_state()

    def get_state(self):
        return {
            'grid': self.grid,
            'current_player': self.current_player,
            'mode': self.mode,
            'game_over': self.game_over_flag,
            'winner': self.winner,
            'winning_cells': self.winning_cells,
            'last_col': self.last_col,
        }

    def make_move(self, col):
        col = int(col)
        if self.game_over_flag:
            return self.get_state()
        if not (0 <= col < COLS):
            return self.get_state()

        row = self._drop_row(col)
        if row is None:
            return self.get_state()  # Column full

        self.grid[row][col] = self.current_player
        self.last_col = col
        self._check_win_or_draw(row, col)

        if not self.game_over_flag and self.mode == 'vs_ai' and self.current_player == 2:
            ai_col = self._ai_move()
            if ai_col is not None:
                ai_row = self._drop_row(ai_col)
                if ai_row is not None:
                    self.grid[ai_row][ai_col] = 2
                    self.last_col = ai_col
                    self._check_win_or_draw(ai_row, ai_col)

        return self.get_state()

    def is_game_over(self):
        return self.game_over_flag

    def get_result(self):
        return {
            'winner': self.winner,
            'winning_cells': self.winning_cells,
        }

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _drop_row(self, col):
        """Return the lowest empty row in the column, or None if full."""
        for row in range(ROWS - 1, -1, -1):
            if self.grid[row][col] is None:
                return row
        return None

    def _check_win_or_draw(self, row, col):
        player = self.grid[row][col]
        win_cells = self._find_win(player, row, col)
        if win_cells:
            self.game_over_flag = True
            self.winner = player
            self.winning_cells = win_cells
        elif all(self.grid[0][c] is not None for c in range(COLS)):
            self.game_over_flag = True
            self.winner = 'draw'
        else:
            self.current_player = 2 if player == 1 else 1

    def _find_win(self, player, row, col):
        """Check all 4 directions from (row, col) for a winning line."""
        directions = [(0,1),(1,0),(1,1),(1,-1)]
        for dr, dc in directions:
            cells = [(row, col)]
            for sign in [1, -1]:
                r, c = row + dr*sign, col + dc*sign
                while 0 <= r < ROWS and 0 <= c < COLS and self.grid[r][c] == player:
                    cells.append((r, c))
                    r += dr*sign
                    c += dc*sign
            if len(cells) >= WIN_LENGTH:
                return cells
        return []

    def _ai_move(self):
        """
        Simple heuristic AI:
        1. Win if possible
        2. Block human win
        3. Prefer centre column
        4. Otherwise random
        """
        valid_cols = [c for c in range(COLS) if self._drop_row(c) is not None]
        if not valid_cols:
            return None

        # Check for immediate win or block
        for player in [2, 1]:
            for col in valid_cols:
                row = self._drop_row(col)
                self.grid[row][col] = player
                win = self._find_win(player, row, col)
                self.grid[row][col] = None
                if win:
                    return col

        # Prefer centre
        centre_order = sorted(valid_cols, key=lambda c: abs(c - COLS // 2))
        return centre_order[0] if centre_order else random.choice(valid_cols)
