/**
 * AI Assistant Chat Component
 * LabIQ Health's intelligent data analysis assistant
 * Uses the unified LabIQAI service for all AI operations
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowUp,
  Brain,
  Loader2,
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
import { labIQAI, AISection } from '@/lib/ai/LabIQAI';
import { dashboardService } from '@/lib/services/dashboardService';
import { useToast } from '@/hooks/use-toast';

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sections?: AISection[];
  timestamp?: string;
}

type AssistantMode = 'analysis' | 'automl' | 'educator';

interface AIAssistantChatProps {
  mode?: AssistantMode;
  onModeChange?: (mode: AssistantMode) => void;
  onImmersiveChange?: (isImmersive: boolean) => void;
  initialDatasetId?: string;
}

// =============================================================================
// MODE CONFIGURATIONS
// =============================================================================

const MODE_CONFIG = {
  analysis: {
    icon: BarChart,
    color: 'text-blue-500',
    label: 'Analysis',
    description: 'Data Analysis'
  },
  automl: {
    icon: FlaskConical,
    color: 'text-purple-500',
    label: 'AutoML',
    description: 'AutoML'
  },
  educator: {
    icon: GraduationCap,
    color: 'text-green-500',
    label: 'Educator',
    description: 'Learn'
  }
} as const;

const SUGGESTIONS = {
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
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  mode = 'analysis',
  onModeChange,
  onImmersiveChange,
  initialDatasetId
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<string | null>(initialDatasetId || null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Current mode config
  const currentMode = MODE_CONFIG[mode];
  const ModeIcon = currentMode.icon;

  // =============================================================================
  // EFFECTS
  // =============================================================================

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processingStep]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadChatHistory = useCallback(async () => {
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
  }, [selectedDataset, userId, mode]);

  const saveChatMessage = useCallback(async (message: Message) => {
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
  }, [selectedDataset, userId, mode]);

  const handleSend = useCallback(async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    if (!selectedDataset) {
      alert('Please select a dataset first!');
      return;
    }

    // Create and add user message
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);

    // Reset input and set loading state
    setInput('');
    setIsLoading(true);
    setIsImmersive(true);
    onImmersiveChange?.(true);

    try {
      // Check AI availability
      if (!labIQAI.isAvailable()) {
        throw new Error('AI service is not configured. Please check your configuration.');
      }

      // Show processing steps
      setProcessingStep('Processing your request...');

      // Build conversation history for context
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call the unified AI service
      setProcessingStep('Analyzing data...');
      const response = await labIQAI.dataAnalysis.process(
        selectedDataset,
        text,
        mode,
        conversationHistory
      );

      // Create assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.success ? 'Analysis complete' : response.content,
        sections: response.sections,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveChatMessage(assistantMessage);

      // Auto-pin significant insights to dashboards
      if (response.sections && response.sections.length > 0) {
        const hasChartOrInsight = response.sections.some(
          s => s.type === 'chart' || s.type === 'metric' || s.type === 'list'
        );
        if (hasChartOrInsight) {
          try {
            await dashboardService.autoPinFromAI(
              `AI Insight: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
              response.content || 'AI-generated analysis',
              { sections: response.sections },
              selectedDataset || undefined
            );
            toast({
              title: "Insight Pinned",
              description: "This insight has been auto-pinned to your dashboards",
            });
          } catch (pinError) {
            console.log('Auto-pin skipped:', pinError);
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setProcessingStep('');
    }
  }, [input, isLoading, selectedDataset, messages, mode, saveChatMessage, onImmersiveChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with Mode Selector */}
      <header className="flex items-center justify-between p-4 border-b border-border/40 bg-card/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${currentMode.color} from-current/10 to-current/5`}>
            <ModeIcon className={`w-5 h-5 ${currentMode.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">LabIQ Health Assistant</h2>
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
            {Object.entries(MODE_CONFIG).map(([key, config]) => {
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
      </header>

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
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-5xl mx-auto space-y-6 px-4">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                LabIQ Health Data Analysis
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {selectedDataset
                  ? 'Ask me anything about your data!'
                  : 'Select a dataset to begin analyzing.'
                }
              </p>

              {selectedDataset && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
                  {SUGGESTIONS[mode].map((suggestion, idx) => (
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

          {/* Message List */}
          {messages.map((message, i) => (
            <div key={i} className="space-y-6">
              {message.role === 'user' && (
                <UserQuery
                  content={message.content}
                  timestamp={message.timestamp}
                />
              )}

              {message.role === 'assistant' && (
                <>
                  {message.sections && message.sections.length > 0 ? (
                    <AIResponseRenderer sections={message.sections} />
                  ) : (
                    <div className="p-6 bg-card rounded-lg border border-border/40">
                      <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 px-6 py-4 animate-fade-in">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-muted-foreground">{processingStep}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Fixed Bottom Input */}
      <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative flex items-center gap-3 bg-card border border-border/40 rounded-2xl shadow-lg px-5 py-3.5 transition-shadow hover:shadow-xl">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
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
      </footer>
    </div>
  );
};

export default AIAssistantChat;
