import { useState, useCallback } from 'react'
import questionsData from './questions.json'

const CATEGORIES = Object.keys(questionsData)
const CATEGORY_ICONS = { Science: '🔬', History: '📜', Tech: '💻' }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Quiz() {
  const [category, setCategory] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)  // index of chosen option
  const [answered, setAnswered] = useState(false)
  const [done, setDone] = useState(false)
  const [history, setHistory] = useState([])

  const startQuiz = useCallback((cat) => {
    const qs = shuffle(questionsData[cat])
    setCategory(cat)
    setQuestions(qs)
    setQIdx(0)
    setScore(0)
    setSelected(null)
    setAnswered(false)
    setDone(false)
    setHistory([])
  }, [])

  const handleAnswer = (optIdx) => {
    if (answered) return
    setSelected(optIdx)
    setAnswered(true)
    const q = questions[qIdx]
    const correct = optIdx === q.answer
    if (correct) setScore(s => s + 1)
    setHistory(h => [...h, { question: q.q, chosen: optIdx, correct: q.answer, wasCorrect: correct }])
  }

  const nextQuestion = () => {
    if (qIdx + 1 >= questions.length) {
      setDone(true)
    } else {
      setQIdx(i => i + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const pct = Math.round((score / questions.length) * 100)
  const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good job!' : pct >= 40 ? '📚 Keep studying!' : '💡 Try again!'

  // Category selection screen
  if (!category) {
    return (
      <div className="quiz-app">
        <h2 className="quiz-app__heading">Choose a Category</h2>
        <div className="quiz-categories">
          {CATEGORIES.map(cat => (
            <button key={cat} className="quiz-category-card" id={`quiz-cat-${cat.toLowerCase()}`} onClick={() => startQuiz(cat)}>
              <span className="quiz-category-card__icon">{CATEGORY_ICONS[cat]}</span>
              <span className="quiz-category-card__name">{cat}</span>
              <span className="quiz-category-card__count">{questionsData[cat].length} questions</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Results screen
  if (done) {
    return (
      <div className="quiz-app">
        <div className="quiz-results">
          <div className="quiz-results__grade">{grade}</div>
          <div className="quiz-results__score">
            <span className="quiz-results__num">{score}</span>
            <span className="quiz-results__denom">/ {questions.length}</span>
          </div>
          <div className="quiz-results__pct">{pct}% correct</div>
          <div className="quiz-results__history">
            {history.map((h, i) => (
              <div key={i} className={`quiz-history-item ${h.wasCorrect ? 'correct' : 'wrong'}`}>
                <span className="quiz-history-item__icon">{h.wasCorrect ? '✓' : '✗'}</span>
                <span className="quiz-history-item__q">{h.question}</span>
              </div>
            ))}
          </div>
          <div className="quiz-results__actions">
            <button className="quiz-btn quiz-btn--primary" onClick={() => startQuiz(category)}>Play Again</button>
            <button className="quiz-btn quiz-btn--secondary" onClick={() => setCategory(null)}>Change Category</button>
          </div>
        </div>
      </div>
    )
  }

  // Playing screen
  const q = questions[qIdx]
  return (
    <div className="quiz-app">
      <div className="quiz-header">
        <span className="quiz-header__cat">{CATEGORY_ICONS[category]} {category}</span>
        <span className="quiz-header__progress">Q {qIdx + 1} / {questions.length}</span>
        <span className="quiz-header__score">Score: {score}</span>
      </div>

      <div className="quiz-progress-bar">
        <div className="quiz-progress-bar__fill" style={{ width: `${((qIdx) / questions.length) * 100}%` }} />
      </div>

      <div className="quiz-question">
        <p className="quiz-question__text">{q.q}</p>
        <div className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = 'quiz-option'
            if (answered) {
              if (i === q.answer) cls += ' quiz-option--correct'
              else if (i === selected && i !== q.answer) cls += ' quiz-option--wrong'
            } else {
              cls += ' quiz-option--idle'
            }
            return (
              <button
                key={i}
                id={`quiz-opt-${qIdx}-${i}`}
                className={cls}
                onClick={() => handleAnswer(i)}
                disabled={answered}
              >
                <span className="quiz-option__letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {answered && (
        <div className="quiz-feedback">
          <span className={selected === q.answer ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}>
            {selected === q.answer ? '✓ Correct!' : `✗ The answer was: ${q.options[q.answer]}`}
          </span>
          <button className="quiz-btn quiz-btn--primary" onClick={nextQuestion}>
            {qIdx + 1 >= questions.length ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  )
}
