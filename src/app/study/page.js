'use client'

import { useState, useRef } from 'react'

export default function StudyPage() {
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [studyMaterial, setStudyMaterial] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef(null)

  const [testData, setTestData] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [showReview, setShowReview] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [wrongQuestions, setWrongQuestions] = useState([])

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setFileLoading(true)
    setFileError('')

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (!data.text?.trim()) throw new Error('No text extracted from PDF')
        setStudyMaterial(data.text)
      } else {
        const text = await file.text()
        if (!text?.trim()) throw new Error('File is empty')
        setStudyMaterial(text)
      }
    } catch (err) {
      setFileError(err.message || 'Failed to read file')
      setFileName('')
      setStudyMaterial('')
    } finally {
      setFileLoading(false)
    }
  }

  function handleRemoveFile() {
    setStudyMaterial('')
    setFileName('')
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleGenerateTest(focusAreas = null) {
    if (!topic.trim() && !studyMaterial) return

    setLoading(true)
    setTestData(null)
    setUserAnswers({})
    setSubmitted(false)
    setShowReview(false)
    setChatMessages([])
    setWrongQuestions([])

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: topic || 'Study Material Review',
          questionCount,
          focusAreas,
          studyMaterial: studyMaterial || null
        })
      })
      const data = await res.json()
      if (data.questions) setTestData(data)
      else alert('Failed to generate test')
    } catch (err) {
      alert('Error generating test')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerSelect(questionId, answerIndex) {
    if (submitted) return
    setUserAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  function handleSubmitTest() {
    if (!testData) return
    const wrong = testData.questions.filter(q => userAnswers[q.id] !== q.correctAnswer).map(q => q.question)
    setWrongQuestions(wrong)
    setSubmitted(true)
    setShowReview(true)
  }

  async function handleSendChat() {
    if (!chatInput.trim() || !testData) return
    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', testData, userAnswers, message: userMessage, studyMaterial: studyMaterial || null })
      })
      const data = await res.json()
      if (data.response) setChatMessages(prev => [...prev, { role: 'ai', content: data.response }])
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setChatLoading(false)
    }
  }

  function getScore() {
    if (!testData) return { correct: 0, total: 0, percentage: 0 }
    const correct = testData.questions.filter(q => userAnswers[q.id] === q.correctAnswer).length
    const total = testData.questions.length
    return { correct, total, percentage: Math.round((correct / total) * 100) }
  }

  const score = getScore()
  const canGenerate = topic.trim() || studyMaterial

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex">
      <main className={`flex-1 p-6 pt-8 transition-all ${showReview && submitted ? 'mr-80' : ''}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">🧠 Practice Test</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Enter a topic or upload study materials to generate a test</p>

          {!testData && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Topic</label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., World War II, Photosynthesis..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Study Material <span className="text-gray-500">(optional)</span></label>
                {!studyMaterial && !fileLoading ? (
                  <div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${fileError ? 'border-red-400 hover:border-red-500' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
                    >
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm text-gray-500">Click to upload notes, study guide, or PDF</p>
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} className="hidden" />
                    </div>
                    {fileError && <p className="text-sm text-red-500 mt-2">⚠️ {fileError}</p>}
                  </div>
                ) : fileLoading ? (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mb-2"></div>
                    <p className="text-sm text-gray-500">Extracting text from {fileName}...</p>
                  </div>
                ) : (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">📄 {fileName} ({studyMaterial.length.toLocaleString()} chars)</span>
                      <button onClick={handleRemoveFile} className="text-red-500 text-sm hover:text-red-600">Remove</button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Number of questions</label>
                <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none">
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>

              <button onClick={() => handleGenerateTest()} disabled={loading || !canGenerate} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Generating Test...' : 'Generate Test'}
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-500">Creating your test...</p>
            </div>
          )}

          {testData && !loading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{testData.topic}</h2>
                {studyMaterial && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded text-indigo-600 dark:text-indigo-400">Based on your notes</span>}
              </div>

              {submitted && (
                <div className={`rounded-2xl p-6 text-center ${score.percentage >= 70 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">{score.percentage}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{score.correct} out of {score.total} correct</div>
                  <div className="flex gap-3 justify-center mt-4 flex-wrap">
                    <button onClick={() => handleGenerateTest(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">New Test</button>
                    {wrongQuestions.length > 0 && (
                      <button onClick={() => handleGenerateTest(wrongQuestions)} className="px-4 py-2 border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Practice Similar ({wrongQuestions.length})</button>
                    )}
                  </div>
                </div>
              )}

              {testData.questions.map((q, idx) => {
                const isCorrect = submitted && userAnswers[q.id] === q.correctAnswer
                const isWrong = submitted && userAnswers[q.id] !== undefined && !isCorrect

                return (
                  <div key={q.id} className={`rounded-2xl border p-5 ${submitted ? (isCorrect ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : isWrong ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800') : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                    <div className="font-medium mb-3 text-gray-900 dark:text-white">
                      <span className="text-gray-500 mr-2">Q{idx + 1}.</span>{q.question}
                    </div>
                    {q.subtopic && <div className="text-xs text-gray-500 mb-3">Topic: {q.subtopic}</div>}
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx
                        const isCorrectOpt = q.correctAnswer === optIdx
                        let cls = 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:border-indigo-300'
                        if (submitted) {
                          if (isCorrectOpt) cls = 'border-green-500 bg-green-50 dark:bg-green-900/30'
                          else if (isSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-900/30'
                        } else if (isSelected) {
                          cls = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        }
                        return (
                          <button key={optIdx} onClick={() => handleAnswerSelect(q.id, optIdx)} disabled={submitted} className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${cls} text-gray-900 dark:text-white disabled:cursor-default`}>
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    {submitted && <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3"><strong>Explanation:</strong> {q.explanation}</div>}
                  </div>
                )
              })}

              {!submitted && (
                <button onClick={handleSubmitTest} disabled={Object.keys(userAnswers).length === 0} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  Submit Test
                </button>
              )}

              {submitted && (
                <button onClick={() => { setTestData(null); setTopic(''); setStudyMaterial(''); setFileName('') }} className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Start New Topic
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {showReview && submitted && (
        <aside className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">🤖 AI Tutor</h2>
            <p className="text-xs text-gray-500">Ask about any question you got wrong</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                <p>Ask me about any question!</p>
                <div className="mt-4 space-y-2 text-xs">
                  <button onClick={() => setChatInput("Why did I get Q1 wrong?")} className="block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300">"Why did I get Q1 wrong?"</button>
                  <button onClick={() => setChatInput("Explain the topics I struggled with")} className="block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300">"Explain what I got wrong"</button>
                </div>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`rounded-xl p-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-4' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white mr-4'}`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 mr-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask about your test..."
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
              <button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50">Send</button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
