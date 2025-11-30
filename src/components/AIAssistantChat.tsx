import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowUp,
  Sparkles, 
  Brain, 
  TrendingUp,
  Loader2,
  Paperclip,
  ChevronDown
} from 'lucide-react';
import { AIResponseRenderer } from './assistant/AIResponseRenderer';
import { UserQuery } from './assistant/UserQuery';
import { DatasetSelector } from './assistant/DatasetSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Section {
  type: 'heading' | 'paragraph' | 'list' | 'chart' | 'insight';
  content?: string;
  title?: string;
  items?: string[];
  chartType?: 'bar' | 'line' | 'pie';
  data?: {
    labels: string[];
    values: number[];
  };
  xLabel?: string;
  yLabel?: string;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sections?: Section[];
  timestamp?: string;
};

type AssistantMode = 'analysis' | 'automl' | 'educator';

interface AIAssistantChatProps {
  mode?: AssistantMode;
  onModeChange?: (mode: AssistantMode) => void;
  onImmersiveChange?: (isImmersive: boolean) => void;
}

export const AIAssistantChat = ({ mode = 'analysis', onModeChange, onImmersiveChange }: AIAssistantChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isImmersive, setIsImmersive] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  const suggestions = {
    analysis: [
      "Show me the correlation between temperature and yield",
      "Summarize the top variables in my dataset",
      "Find outliers in the absorption spectrum data",
      "What are the trends in this time series?"
    ],
    automl: [
      "Build a model to predict yield based on soil moisture",
      "Which algorithm works best for this classification task?",
      "Explain the feature importance in my model",
      "How can I improve model accuracy?"
    ],
    educator: [
      "What is the difference between R² and RMSE?",
      "Explain random forest in simple terms",
      "When should I use classification vs regression?",
      "What is feature engineering?"
    ]
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsImmersive(true);
    onImmersiveChange?.(true); // Enter immersive mode
    setThinking('Analyzing your data...');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-data-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            mode,
            datasetId: selectedDataset
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      setThinking('');
      
      // Stream processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      // Add assistant message placeholder
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '',
        timestamp: new Date().toISOString()
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch (e) {
            // Partial JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Parse final accumulated JSON response
      try {
        const jsonResponse = JSON.parse(assistantContent);
        if (jsonResponse.sections) {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantContent,
              sections: jsonResponse.sections,
              timestamp: new Date().toISOString()
            };
            return newMessages;
          });
        }
      } catch (e) {
        // Not valid JSON, keep as plain text
        console.log('Response is not structured JSON, displaying as text');
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
        }
      ]);
    } finally {
      setIsLoading(false);
      setThinking('');
      // Stay in immersive mode permanently
    }
  };

  const modeConfig = {
    analysis: { icon: TrendingUp, color: 'text-accent', label: 'Flash', description: 'Data Analysis' },
    automl: { icon: Brain, color: 'text-secondary', label: 'Flash', description: 'AutoML' },
    educator: { icon: Sparkles, color: 'text-primary', label: 'Flash', description: 'Educator' }
  };

  const currentMode = modeConfig[mode];

  return (
    <div className="flex flex-col h-full relative">
      {/* Dataset Selector - Compact, hidden in immersive mode */}
      {!isImmersive && (
        <div className="mb-4 animate-fade-in">
          <DatasetSelector
            selectedDataset={selectedDataset}
            onSelectDataset={setSelectedDataset}
          />
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-5xl mx-auto space-y-6 px-4">
          {messages.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                AI Data Analysis Assistant
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Upload your dataset and ask questions. I'll analyze, visualize, and explain your data in real-time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                {suggestions[mode].slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="px-4 py-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all text-sm text-left hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => {
            const isLastMessage = i === messages.length - 1;
            
            return (
              <div key={i} className="space-y-6">
                {/* User Query Card */}
                {message.role === 'user' && (
                  <UserQuery 
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                )}

                {/* Assistant Response */}
                {message.role === 'assistant' && message.content && (
                  <>
                    {message.sections ? (
                      <AIResponseRenderer sections={message.sections} />
                    ) : (
                      <div className="p-6 bg-card rounded-lg border border-border/40">
                        <p className="text-foreground/90 leading-relaxed">{message.content}</p>
                      </div>
                    )}

                    {/* Suggested Follow-ups - Only after last assistant message and not in immersive mode */}
                    {isLastMessage && !isLoading && !isImmersive && (
                      <div className="space-y-2 animate-fade-in">
                        <p className="text-xs font-medium text-muted-foreground px-2">
                          Suggested follow-ups:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {suggestions[mode].slice(0, 3).map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(suggestion)}
                              className="px-4 py-2.5 bg-muted/20 hover:bg-muted/40 rounded-lg transition-all text-sm text-left border border-border/30 hover:border-border/60"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          
          {/* Loading indicator with typing animation */}
          {isLoading && (
            <div className="flex items-center gap-3 px-6 py-4 animate-fade-in">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-muted-foreground">{thinking}</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative flex items-center gap-3 bg-card border border-border/40 rounded-2xl shadow-lg px-5 py-3.5 transition-shadow hover:shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question about your data..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
              disabled={isLoading}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-border/40 hover:bg-muted/50"
                  disabled={isLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">{currentMode.label}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {Object.entries(modeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => onModeChange?.(key as AssistantMode)}
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {config.description}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};