import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowUp,
  Sparkles,
  Brain,
  TrendingUp,
  Loader2,
  Paperclip,
  ChevronDown,
  FlaskConical,
  GraduationCap,
  BarChart
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
import { getDeviceContextForAI } from '@/lib/services/deviceDataService';

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
  initialDatasetId?: string;
}

export const AIAssistantChat = ({ mode = 'analysis', onModeChange, onImmersiveChange, initialDatasetId }: AIAssistantChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<string | null>(initialDatasetId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Update selected dataset if prop changes
  useEffect(() => {
    if (initialDatasetId) {
      setSelectedDataset(initialDatasetId);
    }
  }, [initialDatasetId]);

  // Load chat history when dataset or mode changes
  useEffect(() => {
    if (selectedDataset && userId) {
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [selectedDataset, mode, userId]);

  const loadChatHistory = async () => {
    if (!selectedDataset || !userId) return;

    try {
      const { data, error } = await supabase
        .from('chat_history' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('dataset_id', selectedDataset)
        .eq('mode', mode)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages = (data as any[]).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          sections: msg.sections,
          timestamp: msg.timestamp
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
  };

  const saveChatMessage = async (message: Message) => {
    if (!selectedDataset || !userId) return;

    try {
      await supabase.from('chat_history' as any).insert({
        user_id: userId,
        dataset_id: selectedDataset,
        mode,
        role: message.role,
        content: message.content,
        sections: message.sections || null,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  const suggestions = {
    analysis: [
      "What are the main variables in this dataset?",
      "Show me correlations between variables",
      "Find outliers in the data",
      "Summarize the key statistics"
    ],
    automl: [
      "Build a predictive model for this data",
      "Which algorithm works best here?",
      "Show me feature importance",
      "How can I improve model accuracy?"
    ],
    educator: [
      "Explain correlation analysis",
      "What is machine learning?",
      "When should I use regression vs classification?",
      "What are outliers and why do they matter?"
    ]
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    if (!selectedDataset) {
      alert('Please select a dataset first!');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);
    setInput('');
    setIsLoading(true);
    setIsImmersive(true);
    onImmersiveChange?.(true);
    setThinking('Analyzing your data...');

    try {
      // Get device context for AI
      let deviceContext = null;
      if (userId) {
        try {
          deviceContext = await getDeviceContextForAI(userId, 50);
        } catch (err) {
          console.warn('Could not fetch device context:', err);
        }
      }

      // Use local ML service
      const response = await fetch('http://localhost:8002/api/ml/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          mode,
          datasetId: selectedDataset,
          deviceContext // Include device streaming data context
        }),
      }
      );

      if (!response.ok) {
        throw new Error('Failed to get response from AI Assistant');
      }

      const data = await response.json();
      const assistantContent = "Here is the analysis:"; // The content is mainly in sections now

      // Parse final JSON response
      // The python API returns { sections: [...] }
      const sections = data.sections;

      const finalMessage: Message = {
        role: 'assistant',
        content: assistantContent,
        sections,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, finalMessage]);
      await saveChatMessage(finalMessage);

      /* Streaming logic removed for local API consistency */

      setThinking('');

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      await saveChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setThinking('');
    }
  };

  const modeConfig = {
    analysis: { icon: BarChart, color: 'text-blue-500', label: 'Analysis', description: 'Data Analysis' },
    automl: { icon: FlaskConical, color: 'text-purple-500', label: 'AutoML', description: 'AutoML' },
    educator: { icon: GraduationCap, color: 'text-green-500', label: 'Educator', description: 'Learn' }
  };

  const currentMode = modeConfig[mode];
  const ModeIcon = currentMode.icon;

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with Mode Selector */}
      <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${currentMode.color} from-current/10 to-current/5`}>
            <ModeIcon className={`w-5 h-5 ${currentMode.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">{currentMode.description} Mode</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ModeIcon className="w-4 h-4" />
              {currentMode.label}
              <ChevronDown className="w-3 h-3" />
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
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  {config.description}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dataset Selector */}
      {!isImmersive && (
        <div className="p-4 animate-fade-in">
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
                {selectedDataset ? `Ask me anything about your data!` : `Select a dataset to begin analyzing.`}
              </p>
              {selectedDataset && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
                  {suggestions[mode].slice(0, 4).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggestion)}
                      className="px-4 py-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all text-sm text-left hover:shadow-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message, i) => (
            <div key={i} className="space-y-6">
              {message.role === 'user' && (
                <UserQuery
                  content={message.content}
                  timestamp={message.timestamp}
                />
              )}

              {message.role === 'assistant' && message.content && (
                <>
                  {message.sections ? (
                    <AIResponseRenderer sections={message.sections} />
                  ) : (
                    <div className="p-6 bg-card rounded-lg border border-border/40">
                      <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

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
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={selectedDataset ? "Ask about your data..." : "Select a dataset first..."}
              disabled={!selectedDataset || isLoading}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />

            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || !selectedDataset}
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
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