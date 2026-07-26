"""
Tic-Tac-Toe — CodeArcade
==========================
Pure Python logic for Tic-Tac-Toe with minimax AI.
Implements the shared GameInterface.

Key concepts: Minimax algorithm, game tree search, alpha-beta pruning,
optimal play. The AI is unbeatable on 'hard' difficulty — it will always
win or draw. On 'easy' difficulty the AI plays randomly.
"""

import random


class TicTacToe:
    """Tic-Tac-Toe game with optional AI opponent using minimax."""

    WINNING_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # cols
        [0, 4, 8], [2, 4, 6],             # diagonals
    ]

    def new_game(self, config=None):
        """
        Initialize a new game.
        config keys:
            mode      — 'vs_ai' | '2player' (default 'vs_ai')
            difficulty — 'easy' | 'hard' (default 'hard'), only used in vs_ai
        """
        config = config or {}
        self.board = [None] * 9          # None | 'X' | 'O'
        self.current_player = 'X'        # X always goes first
        self.mode = config.get('mode', 'vs_ai')
        self.difficulty = config.get('difficulty', 'hard')
        self.game_over = False
        self.winner = None               # None | 'X' | 'O' | 'draw'
        self.winning_line = None
        return self.get_state()

    def get_state(self):
        """Return current game state as a serialisable dict."""
        return {
            'board': self.board,
            'current_player': self.current_player,
            'mode': self.mode,
            'difficulty': self.difficulty,
            'game_over': self.game_over,
            'winner': self.winner,
            'winning_line': self.winning_line,
        }

    def make_move(self, position):
        """
        Process a player action.
        position — integer 0-8 representing the board cell.
        Returns updated state dict.
        """
        if self.game_over:
            return self.get_state()

        position = int(position)
        if self.board[position] is not None:
            return self.get_state()  # Invalid move — ignore

        # Place human move
        self.board[position] = self.current_player
        self._check_game_over()

        # If vs AI and game still running, let AI move
        if not self.game_over and self.mode == 'vs_ai' and self.current_player == 'O':
            ai_pos = self._get_ai_move()
            if ai_pos is not None:
                self.board[ai_pos] = 'O'
                self._check_game_over()

        return self.get_state()

    def is_game_over(self):
        return self.game_over

    def get_result(self):
        return {
            'winner': self.winner,
            'board': self.board,
            'winning_line': self.winning_line,
        }

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _check_game_over(self):
        """Check for win or draw after a move."""
        winner_symbol = self._check_winner(self.board)
        if winner_symbol:
            self.game_over = True
            self.winner = winner_symbol
        elif None not in self.board:
            self.game_over = True
            self.winner = 'draw'
        else:
            # Switch player
            self.current_player = 'O' if self.current_player == 'X' else 'X'

    def _check_winner(self, board):
        """Return winning symbol or None."""
        for line in self.WINNING_LINES:
            a, b, c = line
            if board[a] and board[a] == board[b] == board[c]:
                self.winning_line = line
                return board[a]
        return None

    def _get_ai_move(self):
        """Return AI move position based on difficulty."""
        empty = [i for i, v in enumerate(self.board) if v is None]
        if not empty:
            return None
        if self.difficulty == 'easy':
            return random.choice(empty)
        # Hard — minimax with alpha-beta pruning
        best_score = float('-inf')
        best_move = None
        for pos in empty:
            self.board[pos] = 'O'
            score = self._minimax(self.board, 0, False, float('-inf'), float('inf'))
            self.board[pos] = None
            if score > best_score:
                best_score = score
                best_move = pos
        return best_move

    def _minimax(self, board, depth, is_maximizing, alpha, beta):
        """Alpha-beta pruned minimax. AI = 'O' (maximizer)."""
        winner = self._check_winner_static(board)
        if winner == 'O':
            return 10 - depth
        if winner == 'X':
            return depth - 10
        if None not in board:
            return 0

        empty = [i for i, v in enumerate(board) if v is None]
        if is_maximizing:
            best = float('-inf')
            for pos in empty:
                board[pos] = 'O'
                best = max(best, self._minimax(board, depth + 1, False, alpha, beta))
                board[pos] = None
                alpha = max(alpha, best)
                if beta <= alpha:
                    break
            return best
        else:
            best = float('inf')
            for pos in empty:
                board[pos] = 'X'
                best = min(best, self._minimax(board, depth + 1, True, alpha, beta))
                board[pos] = None
                beta = min(beta, best)
                if beta <= alpha:
                    break
            return best

    def _check_winner_static(self, board):
        """Check winner without mutating self.winning_line (used in minimax)."""
        for line in self.WINNING_LINES:
            a, b, c = line
            if board[a] and board[a] == board[b] == board[c]:
                return board[a]
        return None
