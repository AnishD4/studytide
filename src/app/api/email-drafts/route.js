import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const EMAIL_TEMPLATES = {
  grade_question: {
    subject: 'Question About My Grade on {assignment}',
    tone: 'polite',
  },
  extension_request: {
    subject: 'Extension Request for {assignment}',
    tone: 'formal',
  },
  absence_notification: {
    subject: 'Absence Notification - {date}',
    tone: 'formal',
  },
  clarification: {
    subject: 'Clarification Needed on {topic}',
    tone: 'polite',
  },
  thank_you: {
    subject: 'Thank You - {reason}',
    tone: 'warm',
  },
  meeting_request: {
    subject: 'Meeting Request - {topic}',
    tone: 'professional',
  },
  late_work: {
    subject: 'Late Work Submission - {assignment}',
    tone: 'apologetic',
  },
  recommendation_request: {
    subject: 'Letter of Recommendation Request',
    tone: 'formal',
  },
}

function generateEmailDraft(type, context) {
  const {
    teacherName,
    studentName,
    className,
    assignment,
    date,
    topic,
    reason,
    additionalContext
  } = context

  const greetings = {
    formal: `Dear ${teacherName || 'Teacher'},`,
    polite: `Dear ${teacherName || 'Teacher'},`,
    warm: `Dear ${teacherName || 'Teacher'},`,
    professional: `Dear ${teacherName || 'Teacher'},`,
    apologetic: `Dear ${teacherName || 'Teacher'},`,
  }

  const closings = {
    formal: 'Sincerely,',
    polite: 'Thank you for your time,',
    warm: 'With gratitude,',
    professional: 'Best regards,',
    apologetic: 'I sincerely apologize for any inconvenience,',
  }

  const template = EMAIL_TEMPLATES[type]
  if (!template) {
    return null
  }

  const tone = template.tone
  let subject = template.subject
    .replace('{assignment}', assignment || '[Assignment Name]')
    .replace('{date}', date || '[Date]')
    .replace('{topic}', topic || '[Topic]')
    .replace('{reason}', reason || '[Reason]')

  let body = ''

  switch (type) {
    case 'grade_question':
      body = `${greetings[tone]}

I hope this email finds you well. I am writing to inquire about my grade on the recent ${assignment || '[assignment]'} in ${className || 'your class'}.

After reviewing my work, I would like to better understand the areas where I could improve. ${additionalContext ? `Specifically, ${additionalContext}` : 'I want to make sure I understand the expectations for future assignments.'}

Would you be available to discuss this with me? I am happy to meet during office hours or at any time that is convenient for you.

${closings[tone]}
${studentName || '[Your Name]'}`
      break

    case 'extension_request':
      body = `${greetings[tone]}

I am writing to respectfully request an extension for the ${assignment || '[assignment]'} that is due on ${date || '[due date]'} in ${className || 'your class'}.

${additionalContext || 'Due to unforeseen circumstances, I am finding it difficult to complete the assignment by the original deadline while maintaining the quality of work I strive to submit.'}

I understand the importance of meeting deadlines and I assure you this is not a request I make lightly. If an extension is possible, I would be grateful for any additional time you could provide.

Please let me know if you would like to discuss this further or if there is any additional information I can provide.

${closings[tone]}
${studentName || '[Your Name]'}`
      break

    case 'absence_notification':
      body = `${greetings[tone]}

I am writing to inform you that I will be absent from ${className || 'class'} on ${date || '[date]'}.

${additionalContext || 'I wanted to notify you in advance so I can make arrangements to catch up on any missed material.'}

Could you please let me know what assignments or materials I should review, and if there is any classwork I can complete in advance?

I appreciate your understanding and will make sure to stay on top of the coursework.

${closings[tone]}
${studentName || '[Your Name]'}`
      break

    case 'clarification':
      body = `${greetings[tone]}

I hope you are doing well. I am reaching out because I need some clarification regarding ${topic || '[topic]'} from ${className || 'class'}.

${additionalContext || 'I have reviewed my notes and the textbook, but I am still having trouble understanding this concept fully.'}

Would it be possible to schedule a time to discuss this, or could you point me to additional resources that might help?

Thank you for your patience and guidance.

${closings[tone]}
${studentName || '[Your Name]'}`
      break

    case 'thank_you':
      body = `${greetings[tone]}

I wanted to take a moment to express my sincere gratitude for ${reason || 'your help and support'}.

${additionalContext || 'Your dedication to helping students succeed has made a real difference in my academic journey.'}

Thank you again for everything you do.

${closings[tone]}
${studentName || '[Your Name]'}`
      break

    case 'meeting_request':
      body = `${greetings[tone]}

I am writing to request a meeting to discuss ${topic || '[topic]'} related to ${className || 'your class'}.

${additionalContext || 'I believe a brief conversation would help me better understand the material and improve my performance.'}

I am available during your office hours, but I am also flexible if another time works better for you. Please let me know what times might be convenient.

${closings[tone]}
${studentName || '[Your Name]'}`
      break

    case 'late_work':
      body = `${greetings[tone]}

I am writing to sincerely apologize for the late submission of ${assignment || '[assignment]'} for ${className || 'your class'}.

${additionalContext || 'I understand the importance of meeting deadlines and I take full responsibility for this delay.'}

I have attached/submitted my completed work and I hope you will still accept it. I will make every effort to ensure this does not happen again in the future.

Thank you for your understanding.

${closings[tone]}
${studentName || '[Your Name]'}`
      break

    case 'recommendation_request':
      body = `${greetings[tone]}

I hope this email finds you well. I am reaching out to ask if you would be willing to write a letter of recommendation for me.

${additionalContext || 'I am applying to [college/program/scholarship] and I believe your perspective on my work in your class would be valuable to my application.'}

I have truly enjoyed and learned a great deal from ${className || 'your class'}, and I feel that you can speak to my academic abilities and character.

If you are willing, I would be happy to provide you with any additional information you might need, such as my resume, personal statement, or specific points you might want to address.

The deadline for submission is ${date || '[deadline]'}. Please let me know if this timeline works for you.

${closings[tone]}
${studentName || '[Your Name]'}`
      break
  }

  return {
    type,
    subject,
    body,
    tone: template.tone,
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return available email templates
    return NextResponse.json({
      templates: Object.keys(EMAIL_TEMPLATES).map(key => ({
        type: key,
        label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        ...EMAIL_TEMPLATES[key],
      }))
    })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, context } = body

    // Get student name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const enrichedContext = {
      ...context,
      studentName: context.studentName || profile?.full_name || user.user_metadata?.full_name,
    }

    const emailDraft = generateEmailDraft(type, enrichedContext)

    if (!emailDraft) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    return NextResponse.json(emailDraft)
  } catch (error) {
    console.error('Error generating email draft:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

