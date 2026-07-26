"""
Maze Runner — CodeArcade Kids
================================
Auto-generated maze with player navigation. Implements the shared PuzzleInterface.

Key concepts: Recursive backtracker maze generation, graph traversal,
player position state, wall-based grid representation.
"""

import random

SIZES = {
    'easy':   (7, 7),
    'medium': (11, 11),
    'hard':   (15, 15),
}


class MazeRunner:
    """
    Generates a random maze using recursive backtracker (DFS).
    The maze is represented as a list of cells, each with walls on
    N/S/E/W sides. Player starts at top-left and must reach bottom-right.
    """

    def generate(self, params=None):
        params = params or {}
        difficulty = params.get('difficulty', 'easy')
        rows, cols = SIZES[difficulty]
        self.rows = rows
        self.cols = cols
        self.difficulty = difficulty

        # Each cell: walls dict {N, S, E, W: True=wall present}
        self.cells = [[{'N': True, 'S': True, 'E': True, 'W': True}
                       for _ in range(cols)] for _ in range(rows)]
        self.visited = [[False] * cols for _ in range(rows)]
        self._carve(0, 0)

        # Open entrance (top-left) and exit (bottom-right)
        self.cells[0][0]['N'] = False
        self.cells[rows-1][cols-1]['S'] = False

        self.player_row = 0
        self.player_col = 0
        self.complete = False
        return self.get_state()

    def _carve(self, r, c):
        self.visited[r][c] = True
        directions = [('N', -1, 0), ('S', 1, 0), ('E', 0, 1), ('W', 0, -1)]
        random.shuffle(directions)
        for direction, dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < self.rows and 0 <= nc < self.cols and not self.visited[nr][nc]:
                opposite = {'N':'S','S':'N','E':'W','W':'E'}[direction]
                self.cells[r][c][direction] = False
                self.cells[nr][nc][opposite] = False
                self._carve(nr, nc)

    def get_state(self):
        return {
            'cells': self.cells,
            'rows': self.rows,
            'cols': self.cols,
            'player_row': self.player_row,
            'player_col': self.player_col,
            'complete': self.complete,
            'difficulty': self.difficulty,
        }

    def move(self, direction):
        """Move player in a direction (N/S/E/W). Returns updated state."""
        if self.complete:
            return self.get_state()
        direction = direction.upper()
        cell = self.cells[self.player_row][self.player_col]
        if cell.get(direction, True):
            return self.get_state()  # Wall in the way

        offsets = {'N': (-1,0), 'S': (1,0), 'E': (0,1), 'W': (0,-1)}
        dr, dc = offsets[direction]
        self.player_row += dr
        self.player_col += dc

        if self.player_row == self.rows - 1 and self.player_col == self.cols - 1:
            self.complete = True
        return self.get_state()

    def check_complete(self):
        return self.complete
