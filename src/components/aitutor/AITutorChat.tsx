"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Send, Bot, User, BookOpen, Clock, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  createdAt: Date
  messages: Message[]
}

interface AITutorChatProps {
  subject?: string
  topic?: string
}

export default function AITutorChat({ subject, topic }: AITutorChatProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Quick suggestions for the student
  const quickSuggestions = [
    "Help me understand this concept",
    "Can you explain with an example?",
    "Give me a practice problem",
    "How does this relate to real life?",
    "Can you simplify this explanation?"
  ]

  useEffect(() => {
    // Load conversations (mock data for now)
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = () => {
    // Mock conversations - in a real app, you'd fetch from API
    const mockConversations: Conversation[] = [
      {
        id: "1",
        title: "Mathematics - Algebra Help",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        messages: [
          {
            id: "1",
            role: "user",
            content: "I'm having trouble understanding quadratic equations",
            timestamp: new Date(Date.now() - 86400000)
          },
          {
            id: "2",
            role: "assistant",
            content: "I'd be happy to help you understand quadratic equations! Let's start with the basics. A quadratic equation is an equation of the form ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0.",
            timestamp: new Date(Date.now() - 86300000)
          }
        ]
      },
      {
        id: "2",
        title: "Science - Physics Question",
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        messages: [
          {
            id: "3",
            role: "user",
            content: "Can you explain Newton's laws of motion?",
            timestamp: new Date(Date.now() - 172800000)
          },
          {
            id: "4",
            role: "assistant",
            content: "Certainly! Newton's laws of motion are fundamental principles in physics. Let me explain each one clearly...",
            timestamp: new Date(Date.now() - 172700000)
          }
        ]
      }
    ]
    setConversations(mockConversations)
  }

  const startNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      createdAt: new Date(),
      messages: []
    }
    setActiveConversation(newConversation)
    setMessages([])
    setInputMessage("")
    inputRef.current?.focus()
  }

  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation)
    setMessages(conversation.messages)
    inputRef.current?.focus()
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Simulate API call to AI
      setTimeout(async () => {
        const aiResponse = await getAIResponse(content)
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        setIsLoading(false)
        setIsTyping(false)

        // Update conversation title if it's the first message
        if (messages.length === 0) {
          const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "")
          setActiveConversation(prev => prev ? { ...prev, title: newTitle } : null)
        }
      }, 1000) // Simulate network delay

    } catch (error) {
      console.error("Error sending message:", error)
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const getAIResponse = async (message: string): Promise<string> => {
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.id || "demo-user"}`
        },
        body: JSON.stringify({
          message,
          conversationId: activeConversation?.id,
          subject,
          topic
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      return data.response
    } catch (error) {
      console.error("AI API error:", error)
      return "I apologize, but I'm having trouble responding right now. Please try again later."
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex h-[calc(100vh-200px)] max-w-7xl mx-auto">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-muted/5 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </h2>
            <Button size="sm" onClick={startNewConversation}>
              New Chat
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeConversation?.id === conversation.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => selectConversation(conversation)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(conversation.createdAt)}</span>
                </div>
                {conversation.messages.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {conversation.messages.length} messages
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">AI Tutor</h3>
                  <p className="text-sm text-muted-foreground">
                    {subject && `${subject} • `}
                    {topic && `${topic}`}
                    {!subject && !topic && "Your personal AI tutor"}
                  </p>
                </div>
              </div>
              {activeConversation && (
                <Badge variant="outline" className="text-xs">
                  {activeConversation.title}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {subject && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {subject}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome to AI Tutor!</h3>
                <p className="text-muted-foreground mb-6">
                  I'm here to help you learn. Ask me anything about your studies, and I'll guide you through it step by step.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>
                        {user?.name.split(' ').map(n => n[0]).join('') || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your AI tutor anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={() => sendMessage(inputMessage)} 
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}