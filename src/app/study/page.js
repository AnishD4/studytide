'use client'

import { useState, useRef } from 'react'

export default function StudyPage() {
  // Test setup state
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [studyMaterial, setStudyMaterial] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef(null)

  // Test state
  const [testData, setTestData] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Review state
  const [showReview, setShowReview] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Wrong answers for focused retake
  const [wrongQuestions, setWrongQuestions] = useState([])

  // --------------------------------------------------------------------------
  // FILE HANDLING
  // --------------------------------------------------------------------------

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setFileLoading(true)
    setFileError('')

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Handle PDF files via server API
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData
        })

        const data = await res.json()

        if (data.error) {
          throw new Error(data.error)
        }

        if (!data.text || data.text.trim().length === 0) {
          throw new Error('No text could be extracted from this PDF. It may be scanned or image-based.')
        }

        setStudyMaterial(data.text)
      } else {
        // Handle text files
        const text = await file.text()
        if (!text || text.trim().length === 0) {
          throw new Error('File is empty')
        }
        setStudyMaterial(text)
      }
    } catch (err) {
      console.error('Error reading file:', err)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // --------------------------------------------------------------------------
  // TEST HANDLERS
  // --------------------------------------------------------------------------

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
      if (data.questions) {
        setTestData(data)
      } else {
        alert('Failed to generate test. Please try again.')
      }
    } catch (err) {
      console.error('Error generating test:', err)
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

    // Find wrong answers with their questions for similar practice
    const wrong = testData.questions
      .filter(q => userAnswers[q.id] !== q.correctAnswer)
      .map(q => q.question)

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
        body: JSON.stringify({
          action: 'chat',
          testData,
          userAnswers,
          message: userMessage,
          studyMaterial: studyMaterial || null
        })
      })

      const data = await res.json()
      if (data.response) {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.response }])
      }
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setChatLoading(false)
    }
  }

  function handleRetakeWrong() {
    if (wrongQuestions.length === 0) return
    handleGenerateTest(wrongQuestions)
  }

  function handleRetakeFull() {
    handleGenerateTest(null)
  }

  function getScore() {
    if (!testData) return { correct: 0, total: 0, percentage: 0 }
    const correct = testData.questions.filter(q => userAnswers[q.id] === q.correctAnswer).length
    const total = testData.questions.length
    return { correct, total, percentage: Math.round((correct / total) * 100) }
  }

  const score = getScore()
  const canGenerate = topic.trim() || studyMaterial

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Main Content */}
      <main className={`flex-1 p-6 transition-all ${showReview && submitted ? 'mr-80' : ''}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Study & Test</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Enter a topic or upload study materials to generate a practice test.
          </p>

          {/* Test Setup */}
          {!testData && (
            <div className="space-y-4">
              {/* Topic Input */}
              <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., World War II, Photosynthesis, Python basics..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Study Material <span className="text-zinc-500">(optional)</span>
                </label>

                {!studyMaterial && !fileLoading ? (
                  <div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        fileError ? 'border-red-700 hover:border-red-500' : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm text-zinc-400">
                        Click to upload notes, study guide, or PDF
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        Supports .pdf, .txt, .md files
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.text,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    {fileError && (
                      <p className="text-sm text-red-400 mt-2">⚠️ {fileError}</p>
                    )}
                  </div>
                ) : fileLoading ? (
                  <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-900 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mb-2"></div>
                    <p className="text-sm text-zinc-400">Extracting text from {fileName}...</p>
                    <p className="text-xs text-zinc-600 mt-1">This may take a moment for large PDFs</p>
                  </div>
                ) : (
                  <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{fileName.toLowerCase().endsWith('.pdf') ? '📕' : '📄'}</span>
                        <span className="text-sm font-medium">{fileName}</span>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {studyMaterial.length.toLocaleString()} characters extracted
                    </p>
                  </div>
                )}
              </div>

              {/* Or paste directly */}
              {!studyMaterial && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Or paste your notes directly
                  </label>
                  <textarea
                    value={studyMaterial}
                    onChange={e => setStudyMaterial(e.target.value)}
                    placeholder="Paste your study notes, textbook excerpts, or study guide here..."
                    rows={4}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium mb-1">Number of questions</label>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-white focus:outline-none"
                >
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerateTest()}
                disabled={loading || !canGenerate}
                className="w-full rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Test...' : 'Generate Test'}
              </button>

              {!canGenerate && (
                <p className="text-center text-sm text-zinc-500">
                  Enter a topic or upload study material to continue
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              <p className="mt-4 text-zinc-400">Creating your test...</p>
            </div>
          )}

          {/* Test Questions */}
          {testData && !loading && (
            <div className="space-y-6">
              {/* Test Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{testData.topic}</h2>
                {studyMaterial && (
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                    Based on your notes
                  </span>
                )}
              </div>

              {/* Score Banner (after submission) */}
              {submitted && (
                <div className={`rounded-lg p-4 text-center ${score.percentage >= 70 ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
                  <div className="text-3xl font-bold">{score.percentage}%</div>
                  <div className="text-sm text-zinc-300">{score.correct} out of {score.total} correct</div>

                  <div className="flex gap-3 justify-center mt-4 flex-wrap">
                    <button
                      onClick={handleRetakeFull}
                      className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200"
                    >
                      New Test (Same Topic)
                    </button>
                    {wrongQuestions.length > 0 && (
                      <button
                        onClick={handleRetakeWrong}
                        className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 border border-zinc-600"
                      >
                        Practice Similar Questions ({wrongQuestions.length})
                      </button>
                    )}
                  </div>
                  {wrongQuestions.length > 0 && (
                    <p className="text-xs text-zinc-400 mt-2">
                      "Practice Similar" will generate new questions on the topics you missed
                    </p>
                  )}
                </div>
              )}

              {/* Questions */}
              {testData.questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined
                const isCorrect = submitted && userAnswers[q.id] === q.correctAnswer
                const isWrong = submitted && isAnswered && !isCorrect

                return (
                  <div
                    key={q.id}
                    className={`rounded-lg border p-4 ${
                      submitted
                        ? isCorrect
                          ? 'border-green-700 bg-green-900/20'
                          : isWrong
                          ? 'border-red-700 bg-red-900/20'
                          : 'border-zinc-700 bg-zinc-900'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    <div className="font-medium mb-3">
                      <span className="text-zinc-400 mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </div>

                    {q.subtopic && (
                      <div className="text-xs text-zinc-500 mb-3">
                        Subtopic: {q.subtopic}
                      </div>
                    )}

                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx
                        const isCorrectOption = q.correctAnswer === optIdx

                        let optionClass = 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                        if (submitted) {
                          if (isCorrectOption) {
                            optionClass = 'border-green-600 bg-green-900/30'
                          } else if (isSelected && !isCorrectOption) {
                            optionClass = 'border-red-600 bg-red-900/30'
                          }
                        } else if (isSelected) {
                          optionClass = 'border-white bg-zinc-700'
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleAnswerSelect(q.id, optIdx)}
                            disabled={submitted}
                            className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${optionClass} disabled:cursor-default`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>

                    {/* Explanation after submission */}
                    {submitted && (
                      <div className="mt-3 text-sm text-zinc-400 border-t border-zinc-700 pt-3">
                        <strong className="text-zinc-300">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Submit Button */}
              {!submitted && (
                <button
                  onClick={handleSubmitTest}
                  disabled={Object.keys(userAnswers).length === 0}
                  className="w-full rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Test
                </button>
              )}

              {/* New Test Button */}
              {submitted && (
                <button
                  onClick={() => {
                    setTestData(null)
                    setTopic('')
                    setStudyMaterial('')
                    setFileName('')
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3 font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Start New Topic
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* AI Chat Sidebar */}
      {showReview && submitted && (
        <aside className="fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-700 flex flex-col">
          <div className="p-4 border-b border-zinc-700">
            <h2 className="font-semibold">AI Tutor</h2>
            <p className="text-xs text-zinc-400">Ask about any question you got wrong</p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-8">
                <p>Ask me about any question!</p>
                <div className="mt-4 space-y-2 text-xs">
                  <button
                    onClick={() => setChatInput("Why did I get Q1 wrong?")}
                    className="block w-full px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    "Why did I get Q1 wrong?"
                  </button>
                  <button
                    onClick={() => setChatInput("Explain the topics I struggled with")}
                    className="block w-full px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    "Explain the topics I struggled with"
                  </button>
                  <button
                    onClick={() => setChatInput("Give me tips to remember these concepts")}
                    className="block w-full px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    "Tips to remember these concepts"
                  </button>
                </div>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white text-black ml-4'
                    : 'bg-zinc-800 text-zinc-200 mr-4'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {chatLoading && (
              <div className="bg-zinc-800 rounded-lg p-3 mr-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-zinc-700">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask about your test..."
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none"
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="px-3 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-zinc-200 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
