import { useState } from 'react'

/** Placeholder Python source for apps not yet built */
const PLACEHOLDER_SOURCE = `# This app's Python logic will be implemented in an upcoming phase.
# Each app follows the pattern:
#
#   /apps/{app_name}/logic.py   — pure Python, no UI code
#   /apps/{app_name}/ui.jsx     — React UI component
#   /apps/{app_name}/README.md  — what it does, key concepts
#
# Games additionally implement the shared interface:
#   new_game(), get_state(), make_move(), is_game_over(), get_result()
`

function SourceCodeViewer({ appId, source }) {
  const [open, setOpen] = useState(false)
  const code = source || PLACEHOLDER_SOURCE

  return (
    <div className="source-viewer">
      <button
        className="source-viewer__toggle"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        id={`source-toggle-${appId}`}
      >
        {open ? '🔽' : '▶️'} {open ? 'Hide' : 'View'} Source Code
      </button>

      {open && (
        <div className="source-viewer__code">
          <pre><code>{code}</code></pre>
        </div>
      )}
    </div>
  )
}

export default SourceCodeViewer
