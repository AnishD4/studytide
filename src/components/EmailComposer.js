'use client'

import { useState } from 'react'

const EMAIL_TYPES = [
  { value: 'grade_question', label: '❓ Question About Grade', icon: '📊' },
  { value: 'extension_request', label: '⏰ Extension Request', icon: '📅' },
  { value: 'absence_notification', label: '🏥 Absence Notification', icon: '✈️' },
  { value: 'clarification', label: '💡 Clarification Needed', icon: '🤔' },
  { value: 'thank_you', label: '🙏 Thank You Note', icon: '❤️' },
  { value: 'meeting_request', label: '📅 Meeting Request', icon: '🗓️' },
  { value: 'late_work', label: '📝 Late Work Apology', icon: '😅' },
  { value: 'recommendation_request', label: '📜 Recommendation Request', icon: '🎓' },
]

const DEFAULT_CONTEXT = {
  teacherName: '',
  className: '',
  assignment: '',
  date: '',
  topic: '',
  reason: '',
  additionalContext: '',
}

export default function EmailComposer({ isOpen, onClose, prefilledContext }) {
  const [step, setStep] = useState(1) // 1: type selection, 2: context, 3: preview
  const [emailType, setEmailType] = useState('')
  const [context, setContext] = useState({
    ...DEFAULT_CONTEXT,
    ...(prefilledContext || {}),
  })
  const [generatedEmail, setGeneratedEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)


  const generateEmail = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          context,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedEmail(data)
        setStep(3)
      }
    } catch (error) {
      console.error('Error generating email:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const openInMailClient = () => {
    if (!generatedEmail) return
    const mailtoLink = `mailto:?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`
    window.open(mailtoLink, '_blank')
  }

  const reset = () => {
    setStep(1)
    setEmailType('')
    setGeneratedEmail(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              ✉️ Email Composer
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 1 && 'Select the type of email'}
              {step === 2 && 'Add details for your email'}
              {step === 3 && 'Review and send your email'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {EMAIL_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setEmailType(type.value)
                    setStep(2)
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${
                    emailType === type.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Context Form */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teacher's Name
                  </label>
                  <input
                    type="text"
                    value={context.teacherName}
                    onChange={(e) => setContext({ ...context, teacherName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Mr./Ms./Dr. Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={context.className}
                    onChange={(e) => setContext({ ...context, className: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="AP Chemistry"
                  />
                </div>
              </div>

              {['grade_question', 'extension_request', 'late_work'].includes(emailType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignment/Test Name
                  </label>
                  <input
                    type="text"
                    value={context.assignment}
                    onChange={(e) => setContext({ ...context, assignment: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Chapter 5 Test"
                  />
                </div>
              )}

              {['absence_notification', 'extension_request', 'recommendation_request'].includes(emailType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={context.date}
                    onChange={(e) => setContext({ ...context, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {['clarification', 'meeting_request'].includes(emailType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={context.topic}
                    onChange={(e) => setContext({ ...context, topic: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Homework questions, grade review, etc."
                  />
                </div>
              )}

              {emailType === 'thank_you' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Thank You
                  </label>
                  <input
                    type="text"
                    value={context.reason}
                    onChange={(e) => setContext({ ...context, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Your help with the project"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Context (optional)
                </label>
                <textarea
                  value={context.additionalContext}
                  onChange={(e) => setContext({ ...context, additionalContext: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Any specific details you want to include..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && generatedEmail && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedEmail.subject}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedEmail.subject)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    title="Copy subject"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Body
                </label>
                <div className="relative">
                  <textarea
                    value={generatedEmail.body}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    rows="12"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedEmail.body)}
                    className={`absolute top-2 right-2 px-3 py-1 rounded-lg text-sm transition-all ${
                      copied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">💡 Tips</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Review and personalize the email before sending</li>
                  <li>• Add specific details that are relevant to your situation</li>
                  <li>• Check for any placeholders like [Your Name] that need to be filled</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={() => {
              if (step > 1) setStep(step - 1)
              else reset()
            }}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {step > 1 ? '← Back' : 'Cancel'}
          </button>

          <div className="flex gap-2">
            {step === 2 && (
              <button
                onClick={generateEmail}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>✨ Generate Email</>
                )}
              </button>
            )}

            {step === 3 && (
              <>
                <button
                  onClick={reset}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Start Over
                </button>
                <button
                  onClick={openInMailClient}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  📧 Open in Email
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

