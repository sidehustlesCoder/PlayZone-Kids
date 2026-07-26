import { useState, useEffect } from 'react'

const FILTERS = ['All', 'Active', 'Completed']
const STORAGE_KEY = 'codearcade-todo-tasks'

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

let nextId = Date.now()
function genId() { return ++nextId }

export default function TodoApp() {
  const [tasks, setTasks] = useState(loadTasks)
  const [filter, setFilter] = useState('All')
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [editId, setEditId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => { saveTasks(tasks) }, [tasks])

  const addTask = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setTasks(t => [...t, { id: genId(), title: newTitle.trim(), completed: false, due: newDue || null }])
    setNewTitle('')
    setNewDue('')
  }

  const toggle = (id) => setTasks(t => t.map(tk => tk.id === id ? { ...tk, completed: !tk.completed } : tk))
  const remove = (id) => setTasks(t => t.filter(tk => tk.id !== id))

  const startEdit = (task) => { setEditId(task.id); setEditTitle(task.title) }
  const saveEdit = (id) => {
    if (editTitle.trim()) setTasks(t => t.map(tk => tk.id === id ? { ...tk, title: editTitle.trim() } : tk))
    setEditId(null)
  }

  const clearCompleted = () => setTasks(t => t.filter(tk => !tk.completed))

  const filtered = tasks.filter(tk => {
    if (filter === 'Active') return !tk.completed
    if (filter === 'Completed') return tk.completed
    return true
  })

  const activeCount = tasks.filter(t => !t.completed).length

  const isOverdue = (due) => due && new Date(due) < new Date() && !new Date(due).toDateString().includes(new Date().toDateString())

  return (
    <div className="todo-app">
      {/* Add task form */}
      <form className="todo-add-form" onSubmit={addTask}>
        <input
          type="text"
          className="todo-input"
          placeholder="Add a new task…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          id="todo-new-title"
          aria-label="New task title"
        />
        <input
          type="date"
          className="todo-date-input"
          value={newDue}
          onChange={e => setNewDue(e.target.value)}
          id="todo-new-due"
          aria-label="Due date"
        />
        <button type="submit" className="todo-add-btn" id="todo-add-btn">Add</button>
      </form>

      {/* Filter tabs */}
      <div className="todo-filters" role="tablist">
        {FILTERS.map(f => (
          <button key={f} role="tab" aria-selected={filter === f} className={`todo-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} id={`todo-filter-${f.toLowerCase()}`}>
            {f}
            {f === 'All' && <span className="todo-filter-count">{tasks.length}</span>}
            {f === 'Active' && <span className="todo-filter-count">{activeCount}</span>}
          </button>
        ))}
      </div>

      {/* Task list */}
      <ul className="todo-list" aria-label="Task list">
        {filtered.length === 0 && (
          <li className="todo-empty">
            {filter === 'Completed' ? 'No completed tasks yet.' : 'Nothing here! Add a task above.'}
          </li>
        )}
        {filtered.map(task => (
          <li key={task.id} className={`todo-item ${task.completed ? 'todo-item--done' : ''}`} id={`todo-item-${task.id}`}>
            <button
              className={`todo-check ${task.completed ? 'todo-check--checked' : ''}`}
              onClick={() => toggle(task.id)}
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.completed ? '✓' : ''}
            </button>
            {editId === task.id ? (
              <input
                className="todo-edit-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => saveEdit(task.id)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id) }}
                autoFocus
              />
            ) : (
              <span className="todo-item__title" onDoubleClick={() => startEdit(task)}>
                {task.title}
              </span>
            )}
            {task.due && (
              <span className={`todo-item__due ${isOverdue(task.due) && !task.completed ? 'todo-item__due--overdue' : ''}`}>
                📅 {task.due}
              </span>
            )}
            <div className="todo-item__actions">
              <button className="todo-edit-btn" onClick={() => startEdit(task)} aria-label="Edit task">✏️</button>
              <button className="todo-delete-btn" onClick={() => remove(task.id)} aria-label="Delete task">🗑</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      {tasks.some(t => t.completed) && (
        <div className="todo-footer">
          <span className="todo-footer__count">{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
          <button className="todo-clear-btn" onClick={clearCompleted}>Clear completed</button>
        </div>
      )}
    </div>
  )
}
