# Prompt: Python Mini-Apps & Games Platform

Use this prompt with an AI coding assistant (Claude Code, ChatGPT, etc.) or as your own build spec.

---

## v2 — Optimized for Google Antigravity

Antigravity's agent plans, executes across editor/terminal/browser, and
self-verifies using its built-in browser — so it performs best with
**staged tasks that have explicit acceptance criteria**, rather than one
giant unscoped brief. Paste the phases below into the Agent Manager one at
a time (recommended), or as a single prompt with the phase gates intact.

### Design & branding (define before Phase 1 — avoids a generic "AI dashboard" look)
Specify these explicitly, or the agent will default to a template look
(cream background + terracotta accent, or dark background + one neon
accent are the two most common AI-generated defaults — actively avoid
both unless you specifically want one).
- **Name/identity**: pick a real name (not "PyPlayground" if you want
  something more distinctive) and a one-line tagline.
- **Color palette**: 4-6 named hex values (background, surface, primary
  accent, secondary accent, text, border) — pick something that fits a
  "learn-by-playing-with-code" identity rather than a generic SaaS
  palette.
- **Typography**: a distinct display face for headings/branding + a
  clean body face + a monospace face for code/source display (this
  matters here since source-code viewing is a core feature).
- **Layout signature**: one memorable element — e.g., a distinctive card
  hover state, an animated code-typing effect on the hero, a terminal-
  style app launcher. Pick one, execute it well, keep everything else
  restrained.
- **Consistency**: every app page shares the same header, spacing scale,
  button styles, and error/empty states — a professional platform reads
  as one product, not 11 disconnected demos glued together.

### Kid-friendly design considerations (applies to the apps added in Phase 8)
The games and puzzles in Phase 8 are aimed at a younger audience than the
rest of the platform, so a few extra rules apply to those app pages
specifically:
- **Larger touch targets** — buttons, tiles, and cards at least 44x44px,
  since younger kids often play on tablets.
- **Minimal reading requirement** — favor icons, colors, and pictures over
  dense instructional text; where text is required, keep it short and
  simple (aim for early-reader vocabulary).
- **Positive-only feedback** — celebratory animations/messages for
  success; "wrong" states should be gentle and encouraging ("Try again!"
  not "Incorrect"), never harsh or punishing.
- **No jarring sound or flash** — if audio/animation is added, keep it
  soft and skippable; nothing strobing or startling.
- **Difficulty presets in plain language** — "Easy / Medium / Hard" or
  age-band presets ("Ages 5-7", "Ages 8-10") rather than numeric
  parameters exposed directly in the UI.
- **Consistent "Play Again" / "Back to Games" affordance** on every kids
  app, styled identically across all of them.

### Deployment readiness (build this in from Phase 1, not bolted on later)
- Vite build produces a clean static `/dist` — verify `npm run build`
  succeeds with no errors before considering any phase done
- Favicon, page title, and meta description set (not the Vite default)
- A proper 404/not-found state for unknown app routes
- Basic accessibility floor: visible keyboard focus states, sufficient
  color contrast, alt text on any icons/images that carry meaning
- No hardcoded `localhost` URLs or dev-only assumptions anywhere in the
  code, since Pyodide + localStorage means this can ship as pure static
  files to GitHub Pages, Netlify, Vercel, or Cloudflare Pages with zero
  server config
- `.gitignore` and a real top-level README with setup + deploy
  instructions, written from Phase 1 onward rather than as an
  afterthought

### Technical architecture decisions (lock these in before Phase 1)
- **State pattern for turn-based games**: every turn-based game module
  implements a common interface — `new_game()`, `get_state()`,
  `make_move(input)`, `is_game_over()`, `get_result()`. This keeps
  Tic-Tac-Toe, Hangman, Quiz, Number Guesser, Memory Match, Simon Says,
  and Connect Four consistent and lets the dashboard render any of them
  with the same wrapper component.
- **State pattern for single-session puzzles**: generator-style puzzles
  (Maze Runner, Word Search, Connect-the-Dots) don't fit the turn-based
  interface cleanly, since they're solved in one continuous session
  rather than discrete moves. These implement a lighter shared interface
  instead — `generate(params)`, `get_state()`, `check_complete()` — see
  Phase 8 for details. Keep the two interfaces separate rather than
  forcing puzzles into the game interface; that's a more common failure
  mode than having two small interfaces.
- **Persistence**: use `localStorage` for all client-side state (to-do
  items, scores, saved adventure progress, puzzle best-times). No
  backend DB in MVP — this removes an entire category of agent decisions
  and keeps the app deployable as static files. Revisit only if you add
  real user accounts.
- **Execution model: 100% client-side, no backend at all.** Pyodide
  (Python-in-browser via WASM) runs every app's Python logic directly in
  the browser. The whole platform ships as static files — no server to
  run, deploy, or maintain. This is the single most important constraint
  in this version of the spec, and it changes how the Web Scraper (Phase
  5) has to work — see that phase for details.
- **Repo structure** (specify this exactly so the agent doesn't invent
  its own):
  ```
  /apps/{app_name}/
    logic.py       # pure Python, no UI code, unit-testable
    ui.jsx (or .html)
    README.md      # 2-3 sentences: what it does, key concepts demoed
  /shared/
    game_interface.py
    puzzle_interface.py
  /dashboard/
  ```
  No /backend folder — everything under /apps runs in-browser.

---

### Phase 1 — Scaffold + Dashboard (verify before continuing)
```
Set up a new project using React + Vite, with Pyodide integrated for
running Python in-browser. Use the name, tagline, color palette,
typography, and layout signature defined in the Design & Branding
section above — do not default to a generic template look. Create the
repo structure below exactly:

/apps/{app_name}/logic.py, ui.jsx, README.md
/shared/game_interface.py
/shared/puzzle_interface.py
/dashboard/

Build the dashboard: a card grid listing apps (name, one-line
description, category tag: Game / Utility / Tool / Kids, Launch button),
a search bar filtering by name, and category filter tabs. Use placeholder
cards for: To-Do List, Calculator, Number Guessing Game, Text Adventure,
Tic-Tac-Toe, Password Generator, Quiz Game, Unit Converter, Memory Match,
Simon Says, Word Search, Maze Runner. Set a real favicon, page title, and
meta description — not Vite defaults.

Acceptance criteria (verify in your built-in browser before reporting done):
- Dashboard loads with no console errors
- All 12 placeholder cards render with correct category tags
- Search bar filters cards in real time
- Category tabs filter correctly, including the new "Kids" tag
- Layout is responsive at 375px, 768px, and 1440px widths
- Dark mode toggle works and persists on refresh (localStorage)
- Design matches the defined palette/typography — no default Vite/React
  boilerplate styling remaining anywhere
- `npm run build` completes with zero errors and produces a working
  static `/dist` (open the built output directly, not just the dev
  server, to confirm)

Take a screenshot of the dashboard in both light and dark mode as your
verification artifact.
```

### Phase 2 — Simple apps (Calculator, Number Guesser, Password Generator)
```
Implement these three apps inside their /apps/{name}/ folders per the
repo convention. Each app's logic.py must be pure Python with no UI
dependencies, and include a docstring explaining the core logic (this
platform is partly educational — users can view source via a toggle).

1. Calculator: styled UI resembling a real calculator (not a text
   output), keyboard input support, handles divide-by-zero and invalid
   input gracefully with visible error states.
2. Number Guessing Game: configurable range and difficulty
   (easy/medium/hard = number of attempts), shows hint feedback
   (higher/lower), tracks best score in localStorage.
3. Password Generator: options for length, symbols, numbers, uppercase;
   live strength meter (weak/medium/strong) with clear visual feedback.

Acceptance criteria:
- Each app is reachable from the dashboard and launches without errors
- Each app functions correctly for at least 3 manual test cases you run
  yourself in the browser (state what you tested)
- "View Source Code" toggle shows logic.py content for each app
- No shared state leaks between apps (verify by opening two apps in
  sequence and confirming no residual state)

Report which test cases you ran and their results as your verification
artifact.
```

### Phase 3 — Game-interface apps (Tic-Tac-Toe, Number Guesser refactor, Quiz, Hangman)
```
Implement shared/game_interface.py defining the common interface:
new_game(), get_state(), make_move(input), is_game_over(), get_result().
Refactor Number Guessing Game (Phase 2) to use this interface, then
build Tic-Tac-Toe, Quiz Game, and Hangman on top of it.

1. Tic-Tac-Toe: single-player vs AI using minimax (unbeatable on hard
   difficulty), 2-player local mode, win/draw detection with clear
   visual indicator.
2. Quiz Game: at least 3 categories with 5 questions each (store as JSON,
   not hardcoded in logic), score tracking, results summary screen.
3. Hangman: word list by difficulty, visual hangman state (ASCII or SVG),
   letter-guess UI with used-letter tracking.

Acceptance criteria:
- All three games correctly implement the shared interface (no
  game-specific state handling outside get_state/make_move)
- Tic-Tac-Toe AI cannot be beaten on hard difficulty (verify with 3
  playthroughs attempting to win)
- Quiz and Hangman both reach a clear end state (win/loss/game over
  screen) with a "play again" option
- All three appear correctly on the dashboard with working Launch buttons

Report your minimax verification (3 attempted wins, all failed/drawn) as
the acceptance evidence for Tic-Tac-Toe specifically.
```

### Phase 4 — To-Do List, Unit Converter, Text Adventure
```
Implement these three, each with localStorage persistence:

1. To-Do List: add/edit/delete/complete tasks, persists across refresh,
   optional due dates, filter by status (all/active/completed).
2. Unit Converter: at least 3 categories (length, temperature, currency
   with a hardcoded/static rate table — no live API in MVP), clean
   dropdown + input UI.
3. Text Adventure: branching story stored as a JSON tree (not hardcoded
   if/else chains — this matters for maintainability), save/resume
   progress via localStorage, at least 3 distinct endings.

Acceptance criteria:
- To-Do list survives a page refresh with all data intact
- Unit converter produces mathematically correct conversions (spot-check
  and report 2 conversions per category)
- Text adventure can be played to at least 2 different endings, and
  resumes correctly after refresh mid-story

Report your spot-check conversion results and which two Text Adventure
endings you verified as your acceptance evidence.
```

### Phase 5 — Web Scraper (client-side only, via Pyodide + pyfetch)
```
Build this entirely client-side — no backend. Plain browser JavaScript
fetch() is blocked by CORS on most real sites, so use Pyodide's built-in
pyfetch (from pyodide.http import pyfetch) inside logic.py, targeting
ONLY sites that explicitly allow cross-origin requests or provide a
public JSON API — do not attempt to bypass CORS with a third-party proxy,
since that reintroduces a server dependency and reliability risk.

Use an allowlist of 2-3 sites/APIs that are safe, stable, and genuinely
CORS-friendly for this purpose (e.g., a public quotes API, a public
books API). Parse HTML with BeautifulSoup running inside Pyodide if the
source returns HTML, or parse JSON directly if the source is API-based.
Either is fine — the educational point is fetching + parsing structured
data, not scraping raw HTML specifically.

Frontend: dropdown to pick from the allowlist, a "Fetch" button, and a
results table. Clearly label this as "Data Fetcher" or similar if the
source is API-based rather than raw HTML scraping, so the UI doesn't
overpromise what it's doing.

Acceptance criteria:
- Confirm each allowlisted source actually works from the browser
  without CORS errors (test all of them, report which succeeded)
- Fetched data displays correctly in the results table, verified by
  cross-checking 3 rows against the source directly
- Graceful, visible error state if a source is unreachable or returns
  unexpected data (test by temporarily using a bad URL)

Report which sources you verified CORS-free, and your 3-row cross-check,
as your verification artifact.
```

### Phase 6 — Polish pass
```
Final polish across the whole platform:
- Confirm dark mode applies consistently across all apps (including the
  Phase 8 kids apps)
- Confirm mobile responsiveness (375px width) on all app pages, not just
  the dashboard
- Add a "Random App" button on the dashboard
- Add a proper 404/not-found page for unknown routes
- Run an accessibility pass: keyboard focus visible on every interactive
  element, sufficient color contrast, alt text where needed
- Write the top-level README explaining how to add a new mini-app,
  following the repo convention established in Phase 1

Acceptance criteria: take screenshots of 3 different apps in dark mode
at mobile width as final verification artifacts. Confirm `npm run build`
still succeeds with zero errors after all changes.
```

### Phase 7 — Deployment (GitHub Pages)
```
Prepare and deploy the platform to GitHub Pages as a static site.

1. Confirm `npm run build` produces a clean /dist with no console errors
   when the built output is served and opened directly.
2. Set the correct Vite `base` config to match the GitHub Pages repo
   path (e.g., `/repo-name/` for a project page, or `/` if using a
   `username.github.io` root repo) — this is the most common cause of
   broken assets/blank pages on Pages deploys, so get it right before
   moving on.
3. Add a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
   builds and publishes /dist to the `gh-pages` branch (or via the
   official `actions/deploy-pages` flow) on every push to main.
4. Since this is a client-side single-page app with routes per app
   (e.g., /apps/tic-tac-toe), add the standard GitHub Pages SPA
   workaround (a 404.html redirect trick, or hash-based routing if
   simpler) so refreshing on a non-root route doesn't break — GitHub
   Pages serves everything as static files with no server-side rewrite
   support, so this needs an explicit fix, not just React Router
   defaults.
5. Push, let the Action run, and confirm the live
   `https://username.github.io/repo-name/` URL loads correctly,
   including one full playthrough of a game and one full use of a
   utility app on the deployed version (not just localhost).
6. Add the live URL and a short "how this is deployed" note to the
   top-level README.

Acceptance criteria: report the live GitHub Pages URL, confirm the
Actions workflow completed successfully, confirm no console errors on
the live site, and confirm the direct-route refresh test (step 4)
passed.
```

### Phase 8 — Kids Games & Puzzles (NEW)
```
Build a "Kids" category of games and puzzles, applying the kid-friendly
design rules defined in the Design & Branding section above (large touch
targets, minimal reading, positive-only feedback, plain-language
difficulty presets).

First, implement shared/puzzle_interface.py for the single-session
puzzles: generate(params), get_state(), check_complete(). This is
separate from game_interface.py — do not force puzzles into the
turn-based game interface.

Games (use shared/game_interface.py):
1. Memory Match: grid of face-down cards (animal/shape/emoji themes),
   flip two at a time to find pairs, tracks moves and best time in
   localStorage, celebratory animation on full match.
2. Simon Says: flashing color/shape sequence that the player repeats
   back, sequence grows by one each round, tracks longest streak.
3. Connect Four: drop-and-stack grid, single-player vs AI (simple
   heuristic AI is fine, doesn't need to be unbeatable) and 2-player
   local mode, clear win-line highlight.

Puzzles (use shared/puzzle_interface.py):
4. Maze Runner: auto-generated maze at 3 sizes (easy/medium/hard),
   arrow-key or on-screen D-pad movement, timer, "you did it!" end
   state.
5. Word Search: theme picker (animals, space, dinosaurs — store word
   lists as JSON, not hardcoded), auto-placed grid, click-and-drag or
   tap-sequence to circle found words, highlights found words in a
   themed color.
6. Sliding Puzzle (15-puzzle): numbered tiles or a swapped-in
   image/emoji grid, shuffle-on-start (verified solvable), move
   counter, win detection.

Acceptance criteria:
- All six apps are reachable from the dashboard under the "Kids"
  category tag and launch without errors
- Memory Match, Simon Says, and Connect Four correctly implement
  game_interface.py (no game-specific state handling outside
  get_state/make_move)
- Maze Runner, Word Search, and Sliding Puzzle correctly implement
  puzzle_interface.py
- Each app reaches a clear, positive completion state ("Play Again"
  button styled consistently across all six)
- Manually verify each app end-to-end: complete one full Memory Match
  game, beat Simon Says to at least round 5, get one Connect Four win
  against the AI, solve one maze on each difficulty, find all words in
  one Word Search puzzle, and solve one Sliding Puzzle
- Touch targets measured at 44x44px minimum on all six apps (spot-check
  and report)
- No harsh/negative-toned copy anywhere in these six apps (spot-check
  wrong-answer and game-over states specifically)

Report your six end-to-end playthroughs and touch-target spot-check as
verification evidence.
```

---

## Why this structure works better for Antigravity
- Each phase has a **verifiable, browser-checkable acceptance criterion**
  — this is what Antigravity's agent uses to know it's actually done,
  not just "code exists."
- **Locking architecture decisions up front** (state pattern, persistence,
  repo structure) prevents the growing app list from drifting into
  inconsistent implementations, which is the most common failure mode
  when an agent is given full creative discretion over many similar
  small tasks.
- **Phase gates** mean you can review real running output before
  committing to the next chunk of scope, instead of discovering a bad
  architectural choice after many apps are built on top of it.
- **Splitting turn-based games from single-session puzzles** (Phase 8)
  keeps the two shared interfaces honest — Maze Runner and Word Search
  genuinely don't have discrete "moves" the way Tic-Tac-Toe does, and
  forcing them into the same interface would produce awkward workarounds
  later.

---

## The Original Prompt (v1 — for reference / non-agentic tools)

```
Build a web application called "PyPlayground" — a platform showcasing small
Python-based programs (games and utility apps) that users can run directly
in the browser.

### Core Requirements

**Tech Stack:**
- Frontend: React (or plain HTML/CSS/JS if simpler is preferred)
- Backend: Python with FastAPI (or Flask) to serve app logic
- In-browser Python execution: Use Pyodide (Python compiled to WebAssembly)
  so users can run Python code directly in the browser without a backend
  call for simple apps — OR use a backend API endpoint per app for apps
  needing server-side logic (e.g., web scraper).
- Database: SQLite (or PostgreSQL for production) to store user progress,
  saved to-do lists, high scores, etc.

**Architecture:**
1. A landing/dashboard page listing all available apps as cards, each
   showing: name, short description, category tag (Game / Utility / Tool /
   Kids), and a "Launch" button.
2. Each app opens either:
   - In a modal/dedicated page with a code editor pane (showing the Python
     source) + an output/interaction pane (terminal-style or GUI-style)
   - Or as a fully styled mini web-app (recommended for a more "real
     product" feel — e.g., the calculator looks like a calculator, not a
     text output)
3. Categories/filtering: Games, Utilities, Data Tools, Kids
4. Search bar to filter apps by name

**Apps to include (MVP - build these first):**
1. To-Do List (persisted with localStorage or backend DB)
2. Calculator (styled UI, not just command-line simulation)
3. Number Guessing Game
4. Text-Based Adventure Game (with simple branching story + save state)
5. Tic-Tac-Toe (vs AI, minimax algorithm)
6. Password Generator (with strength meter)
7. Quiz/Trivia Game (multiple categories, score tracking)
8. Unit Converter

**Apps to include (Phase 2):**
9. Web Scraper (scrape a safe demo site, display results in a table)
10. Hangman
11. Expense Tracker
12. Markdown Notes App
13. Weather App (uses a free public API)
14. Wordle Clone

**Apps to include (Phase 3 — Kids Games & Puzzles):**
15. Memory Match (card-flip pairs, animal/shape themes)
16. Simon Says (color/shape sequence memory)
17. Connect Four (vs simple AI, 2-player local)
18. Maze Runner (auto-generated maze, arrow-key or D-pad movement)
19. Word Search (theme picker, click-and-drag word finding)
20. Sliding Puzzle / 15-Puzzle (numbered tiles or image grid)

**Design Requirements:**
- Clean, modern UI — card-based dashboard, consistent color scheme,
  dark mode toggle
- Each app should feel like a polished mini-product, not a raw script
  dump — proper input validation, error states, loading states
- Mobile responsive
- Include a "View Source Code" toggle on each app so users can see the
  underlying Python logic (great for a learning-focused platform)
- Kids apps specifically: large touch targets (44x44px+), minimal
  reading requirement, positive-only feedback copy, plain-language
  difficulty presets instead of exposed numeric parameters

**Non-functional requirements:**
- Code should be modular: one file/folder per app under /apps/{app_name}/
- Include comments explaining core logic (this is partly an educational
  platform)
- Add basic user accounts (optional) to save progress/scores across apps
- Include a README explaining how to add a new mini-app to the platform
  (so it's extensible)

**Stretch goals:**
- Leaderboard for games (Tic-Tac-Toe, Quiz, Number Guesser, Connect Four,
  Memory Match, Simon Says)
- "Random App" button
- Difficulty settings where relevant (Hangman, Quiz, Number Guesser, Maze
  Runner, Word Search)

Please start by scaffolding the project structure, then build the
dashboard/landing page, then implement the MVP apps one at a time,
confirming each works before moving to the next.
```

---

## Notes on using this prompt

- **If you're using Claude Code**: paste this directly — it can scaffold the whole repo, install dependencies, and build app-by-app.
- **If using Claude.ai chat**: break it into phases (dashboard first, then 2-3 apps at a time) since large builds work better incrementally.
- **Simplify if you're a beginner**: cut the backend/database requirement first and start with Pyodide-only (all client-side) — this avoids needing to manage a server while you're learning.
- **For learning value**: keep the "View Source Code" toggle — it turns your portfolio piece into a teaching tool too, which is a nice differentiator if you ever show this to employers.
- **If kids are the primary audience**: consider building Phase 8 (Kids Games & Puzzles) right after the dashboard, before the more adult-oriented utility apps — it gives you a playable, shareable product sooner.

## Suggested build order (if doing it yourself, not all at once via AI)
1. Static dashboard with app cards (no functionality yet)
2. Calculator + Number Guessing Game (simplest logic)
3. To-Do List (introduces persistence/state)
4. Tic-Tac-Toe (introduces game logic/AI)
5. Quiz Game (introduces external data/JSON content)
6. Text Adventure (introduces branching state machines)
7. Memory Match + Simon Says (introduces the kids' game-interface apps)
8. Maze Runner + Word Search (introduces the puzzle_interface pattern)
9. Web Scraper (introduces backend API calls, requests/BeautifulSoup)
10. Polish: dark mode, mobile responsiveness, source-code viewer
