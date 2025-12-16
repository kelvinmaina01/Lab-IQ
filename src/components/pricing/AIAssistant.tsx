/**
 * Lab-IQ Assistant Component
 * Professional design with ElevenLabs-style voice calling
 */

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  Loader2,
  X,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  CornerDownLeft,
  Sparkles,
  FlaskConical
} from 'lucide-react';
import { generateLabIQSystemPrompt, QUICK_ANSWERS } from '@/lib/services/labIQKnowledgeBase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AgentMode = 'chat' | 'voice';

const SUGGESTED_QUESTIONS = [
  "What's included in Pro?",
  "How does pricing work?",
  "Is there a free trial?",
  "Student discounts?",
  "Data security?",
  "Cancel anytime?"
];

// Lab-IQ Logo Component
const LabIQLogo = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25 ${className}`}>
      <FlaskConical className={`${iconSizes[size]} text-white`} />
    </div>
  );
};

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>('chat');
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ending'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && mode === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, mode]);

  // Call duration timer
  useEffect(() => {
    if (isInCall && callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isInCall, callStatus]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (mode === 'voice' && isInCall) {
          handleVoiceInput(transcript);
        } else {
          setInput(transcript);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isInCall && mode === 'voice') {
          // Restart listening if still in call
          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Ignore
          }
        } else {
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, [mode, isInCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    setCallStatus('connecting');
    setCallDuration(0);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsInCall(true);
    setCallStatus('connected');

    // Start listening
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Speech recognition not available');
    }

    // Welcome message
    const welcomeMessage = "Hi! I'm your Lab-IQ assistant. How can I help you today?";
    speak(welcomeMessage);
  };

  const endCall = () => {
    setCallStatus('ending');

    // Stop recognition
    recognitionRef.current?.stop();
    setIsListening(false);

    // Stop speaking
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    setTimeout(() => {
      setIsInCall(false);
      setCallStatus('idle');
      setCallDuration(0);
    }, 500);
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsListening(false);

    // Get response
    const response = await getResponse(transcript);

    // Speak the response
    speak(response);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    // Clean text for speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, '. ');

    synthRef.current = new SpeechSynthesisUtterance(cleanText);
    synthRef.current.rate = 0.95;
    synthRef.current.pitch = 1;
    synthRef.current.volume = 0.9;

    // Try to use a professional female voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira') ||
      v.name.includes('Karen') ||
      (v.name.includes('Google') && v.name.includes('Female'))
    ) || voices.find(v => v.lang.includes('en')) || voices[0];

    if (preferredVoice) {
      synthRef.current.voice = preferredVoice;
    }

    synthRef.current.onstart = () => setIsSpeaking(true);
    synthRef.current.onend = () => {
      setIsSpeaking(false);
      if (isInCall && mode === 'voice') {
        setIsListening(true);
      }
    };
    synthRef.current.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(synthRef.current);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const checkQuickAnswers = (question: string): string | null => {
    const lowerQuestion = question.toLowerCase();
    for (const [keyword, answer] of Object.entries(QUICK_ANSWERS)) {
      if (lowerQuestion.includes(keyword)) {
        return answer;
      }
    }
    return null;
  };

  const getResponse = async (text: string): Promise<string> => {
    const quickAnswer = checkQuickAnswers(text);
    if (quickAnswer) {
      return quickAnswer;
    }
    return await callAI(text, messages);
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getResponse(text);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (voiceEnabled && mode === 'chat') {
        speak(response);
      }
    } catch (err) {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm here to help! For detailed questions, feel free to ask about pricing, features, or getting started with Lab-IQ.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const callAI = async (question: string, history: Message[]): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return generateFallbackResponse(question);
    }

    const systemPrompt = generateLabIQSystemPrompt();
    const conversationHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const contents = [
      { role: 'user', parts: [{ text: `Context: ${systemPrompt}` }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with Lab-IQ questions.' }] },
      ...conversationHistory,
      { role: 'user', parts: [{ text: question }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            topP: 0.9,
          }
        })
      }
    );

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || generateFallbackResponse(question);
  };

  const generateFallbackResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('price') || q.includes('cost') || q.includes('plan')) {
      return "Lab-IQ offers flexible plans: Free ($0), Pro ($39/mo annual), Team ($119/mo annual), and Enterprise (custom). All paid plans include a 14-day free trial.";
    }
    if (q.includes('student') || q.includes('academic') || q.includes('university')) {
      return "Students get 90% off with a valid .edu email. Academic institutions and non-profits receive 50% discounts. Verify your status to unlock savings.";
    }
    if (q.includes('trial') || q.includes('free')) {
      return "Yes! Start with our free tier or try Pro/Team with a 14-day trial. No credit card required.";
    }
    if (q.includes('security') || q.includes('safe') || q.includes('data')) {
      return "Your data is protected with AES-256 encryption, TLS 1.3, and row-level security. We're HIPAA-ready and GDPR compliant.";
    }

    return "I can help with pricing, features, security, or getting started. What would you like to know about Lab-IQ?";
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 text-sm" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-4 text-sm" dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '') }} />;
      }
      return line ? <p key={i} className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: line }} /> : null;
    });
  };

  // Voice Call Interface (ElevenLabs style)
  const VoiceCallInterface = () => (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
      {/* Avatar with pulse animation */}
      <div className="relative mb-6">
        {/* Outer pulse rings */}
        {isInCall && (
          <>
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 animate-ping`} style={{ animationDuration: '2s' }} />
            <div className={`absolute -inset-4 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 ${isSpeaking ? 'animate-pulse' : ''}`} />
          </>
        )}

        {/* Main avatar */}
        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 transition-transform duration-300 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
          <FlaskConical className="w-12 h-12 text-white" />

          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <Volume2 className="w-3 h-3 text-white animate-pulse" />
            </div>
          )}

          {/* Listening indicator */}
          {isListening && !isSpeaking && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <div className="flex gap-0.5">
                <div className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status text */}
      <h3 className="text-lg font-semibold mb-1">Lab-IQ Assistant</h3>
      <p className="text-sm text-muted-foreground mb-2">
        {callStatus === 'connecting' && 'Connecting...'}
        {callStatus === 'connected' && (isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Connected')}
        {callStatus === 'ending' && 'Ending call...'}
        {callStatus === 'idle' && 'Ready to assist'}
      </p>

      {/* Duration */}
      {isInCall && (
        <p className="text-2xl font-mono text-foreground/80 mb-6">
          {formatDuration(callDuration)}
        </p>
      )}

      {/* Voice visualizer */}
      {isInCall && (
        <div className="flex items-center gap-1 h-8 mb-6">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-full transition-all duration-150 ${isSpeaking || isListening ? 'animate-pulse' : ''}`}
              style={{
                height: isSpeaking || isListening ? `${Math.random() * 24 + 8}px` : '4px',
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      )}

      {/* Call button */}
      {!isInCall ? (
        <Button
          onClick={startCall}
          disabled={callStatus === 'connecting'}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105"
        >
          {callStatus === 'connecting' ? (
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : (
            <Phone className="w-7 h-7 text-white" />
          )}
        </Button>
      ) : (
        <Button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-105"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </Button>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-6 text-center max-w-[240px]">
        {!isInCall
          ? "Tap to start a voice conversation with Lab-IQ assistant"
          : "Speak naturally. I'll respond when you pause."
        }
      </p>
    </div>
  );

  return (
    <>
      {/* Floating Button with CTA */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* CTA Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Ask me anything!
          </div>
          <div className="absolute top-full right-6 w-2 h-2 bg-foreground rotate-45 -mt-1" />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/40"
          aria-label="Open assistant"
        >
          <FlaskConical className="w-6 h-6" />
        </button>
      </div>

      {/* Chat/Voice Panel */}
      <div className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        <Card className="overflow-hidden shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LabIQLogo size="md" />
              <div>
                <h3 className="font-semibold text-sm">Lab-IQ Assistant</h3>
                <p className="text-xs text-muted-foreground">AI-powered support</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Mode toggle */}
              <div className="flex bg-muted/50 rounded-full p-0.5 mr-2">
                <button
                  onClick={() => { setMode('chat'); endCall(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${mode === 'chat' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Chat
                </button>
                <button
                  onClick={() => setMode('voice')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${mode === 'voice' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Phone className="w-3 h-3 inline mr-1" />
                  Call
                </button>
              </div>

              {/* Voice toggle (chat mode only) */}
              {mode === 'chat' && (
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'text-foreground' : 'text-muted-foreground'}`}
                  title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={() => { setIsOpen(false); endCall(); }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {mode === 'voice' ? (
            <div className="h-[380px]">
              <VoiceCallInterface />
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <LabIQLogo size="lg" className="mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        How can I help you today?
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(q)}
                          className="text-left text-xs p-2.5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-violet-500/10 hover:to-fuchsia-500/10 border border-transparent hover:border-violet-500/20 transition-all duration-200"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <LabIQLogo size="sm" className="mr-2 mt-1 flex-shrink-0" />
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                              : 'bg-muted/70'
                          }`}
                        >
                          {renderContent(msg.content)}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <LabIQLogo size="sm" className="mr-2 mt-1" />
                        <div className="bg-muted/70 rounded-2xl px-4 py-2">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t bg-background/50">
                {/* Stop speaking button */}
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="w-full mb-2 py-1.5 px-3 rounded-lg bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <VolumeX className="w-3 h-3" />
                    Stop speaking
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    disabled={isLoading}
                    className="flex-1 text-sm h-10 border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-violet-500/50 rounded-xl"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/20"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CornerDownLeft className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
};
