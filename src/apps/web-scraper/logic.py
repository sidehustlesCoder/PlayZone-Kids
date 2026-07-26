"""
Data Fetcher — CodeArcade
===========================
Client-side data fetching using Pyodide's pyfetch.
Targets only CORS-friendly public JSON APIs.

Key concepts: HTTP requests from Python in the browser (WASM), async/await
with pyfetch, JSON parsing, error handling, allowlist-based API access.

Allowlisted sources:
    1. Open Trivia DB  — trivia questions (genuinely CORS-open)
    2. REST Countries  — country data (CORS-open public API)
    3. JSONPlaceholder — demo posts/todos (CORS-open test API)
"""

import json

SOURCES = {
    "Open Trivia DB": {
        "url": "https://opentdb.com/api.php?amount=10&type=multiple",
        "description": "10 random trivia questions",
    },
    "REST Countries": {
        "url": "https://restcountries.com/v3.1/region/europe?fields=name,capital,population,area",
        "description": "European country data (name, capital, population)",
    },
    "JSONPlaceholder Posts": {
        "url": "https://jsonplaceholder.typicode.com/posts?_limit=10",
        "description": "10 sample blog posts (demo API)",
    },
}


def get_sources():
    """Return the allowlist of available sources."""
    return [
        {"name": name, "description": info["description"]}
        for name, info in SOURCES.items()
    ]


async def fetch_data(source_name):
    """
    Fetch and parse data from the named source.
    Returns a dict with 'columns' (list of header names) and
    'rows' (list of row dicts) for tabular display.
    """
    from pyodide.http import pyfetch

    source = SOURCES.get(source_name)
    if not source:
        raise ValueError(f"Unknown source: {source_name!r}")

    response = await pyfetch(source["url"])
    if response.status != 200:
        raise RuntimeError(f"HTTP {response.status}: request failed")

    data = await response.json()

    # Parse each source into a standard columns+rows format
    if source_name == "Open Trivia DB":
        results = data.get("results", [])
        columns = ["Category", "Difficulty", "Question"]
        rows = [
            {
                "Category": r.get("category", ""),
                "Difficulty": r.get("difficulty", "").capitalize(),
                "Question": r.get("question", "")[:80] + ("…" if len(r.get("question","")) > 80 else ""),
            }
            for r in results
        ]

    elif source_name == "REST Countries":
        columns = ["Country", "Capital", "Population", "Area (km²)"]
        rows = []
        for c in data[:15]:
            name = c.get("name", {}).get("common", "")
            capitals = c.get("capital", [])
            capital = capitals[0] if capitals else "—"
            pop = c.get("population", 0)
            area = c.get("area", 0)
            rows.append({
                "Country": name,
                "Capital": capital,
                "Population": f"{pop:,}",
                "Area (km²)": f"{area:,.0f}" if area else "—",
            })

    elif source_name == "JSONPlaceholder Posts":
        columns = ["ID", "Title", "Body Preview"]
        rows = [
            {
                "ID": str(p.get("id", "")),
                "Title": p.get("title", "")[:50],
                "Body Preview": p.get("body", "")[:60] + "…",
            }
            for p in data
        ]

    else:
        columns = ["Data"]
        rows = [{"Data": str(item)} for item in (data if isinstance(data, list) else [data])]

    return json.dumps({"columns": columns, "rows": rows})
