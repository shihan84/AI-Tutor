import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { useAuth } from '@/contexts/AuthContext'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, subject, topic } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user from authentication (in a real app, you'd get this from the session)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Extract user ID from auth header (simplified for demo)
    const userId = authHeader.replace('Bearer ', '')
    
    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create or get conversation
    let conversation
    if (conversationId) {
      conversation = await db.aIConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })
    }

    if (!conversation) {
      conversation = await db.aIConversation.create({
        data: {
          userId: userId,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })
    }

    // Save user message
    await db.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message
      }
    })

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Prepare system prompt based on user context
    let systemPrompt = `You are an AI tutor for homeschooling students following the Indian open school syllabus. 
    Your goal is to provide personalized, engaging, and educational support to students.
    
    Current user: ${user.name}
    User role: ${user.role}`

    if (user.studentProfile) {
      systemPrompt += `
    Grade level: ${user.studentProfile.gradeLevel}
    
    Please adapt your teaching style and complexity to match this grade level.`
    }

    if (subject) {
      systemPrompt += `
    Current subject: ${subject}`
    }

    if (topic) {
      systemPrompt += `
    Current topic: ${topic}`
    }

    systemPrompt += `

    Teaching guidelines:
    1. Be patient, encouraging, and supportive
    2. Provide clear, step-by-step explanations
    3. Use examples relevant to Indian context when possible
    4. Ask questions to check understanding
    5. Provide practice problems when appropriate
    6. Adapt to the student's pace and understanding level
    7. Be conversational and engaging
    8. Avoid giving direct answers - guide the student to find solutions
    9. Use simple language appropriate for the grade level
    10. Incorporate Indian educational examples and references when relevant

    Remember: You are a tutor, not just an answer provider. Focus on helping the student learn and understand concepts.`

    // Get conversation history for context
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Create the full message array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // Get AI response
    const completion = await zai.chat.completions.create({
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Save AI response
    await db.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse
      }
    })

    // Update conversation title if it's the first exchange
    if (conversation.messages.length === 0) {
      await db.aIConversation.update({
        where: { id: conversation.id },
        data: {
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        }
      })
    }

    return NextResponse.json({
      response: aiResponse,
      conversationId: conversation.id,
      conversationTitle: conversation.title
    })

  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}