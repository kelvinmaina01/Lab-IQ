/**
 * AI Assistant Chat Component
 * LabIQ Health's intelligent data analysis assistant
 * 
 * Features:
 * - Clean, professional header with Share button
 * - Collapsible Data Explorer right sidebar
 * - Storytelling insights with structured analysis
 * - Interactive charts and tables
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowUp,
  Brain,
  Loader2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  GraduationCap,
  BarChart,
  Pin,
  Check,
  Share2,
  Clock,
  Slack,
  Settings,
  Copy,
  MoreHorizontal,
  PanelRightOpen,
  PanelRightClose,
  Database as DatabaseIcon,
  Zap,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { AIResponseRenderer } from './assistant/AIResponseRenderer';
import { UserQuery } from './assistant/UserQuery';
import { DataExplorerPanel } from './assistant/DataExplorerPanel';
import { DatasetSelector } from './assistant/DatasetSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Removed: AIChatToolbar for cleaner UI
import { useLocation } from 'react-router-dom';
import { labIQAI, AISection } from '@/lib/ai/LabIQAI';
import { dashboardService } from '@/lib/services/dashboardService';
import { useToast } from '@/hooks/use-toast';
import { ModeSelector, AIMode } from './ai/ModeSelector';
import { ExplainabilityPanel } from './ai/ExplainabilityPanel';

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sections?: AISection[];
  timestamp?: string;
  thoughtProcess?: string[];
  challenges?: string[];
  suggestions?: string[];
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
    description: 'Health Data Analysis'
  },
  automl: {
    icon: FlaskConical,
    color: 'text-purple-500',
    label: 'AutoML',
    description: 'Predictive Health Models'
  },
  educator: {
    icon: GraduationCap,
    color: 'text-green-500',
    label: 'Educator',
    description: 'Health Stats Education'
  }
} as const;

const SUGGESTIONS = {
  analysis: [
    "What are the key health indicators in this dataset?",
    "Identify correlations between health variables",
    "Detect outliers in vital signs or health metrics",
    "Suggest which health patterns need deeper investigation"
  ],
  automl: [
    "Build a risk prediction model for this health outcome",
    "Evaluate model performance on health data",
    "Which health variables matter most for prediction?",
    "Optimize model for health data classification"
  ],
  educator: [
    "Explain what normal ranges mean for these health metrics",
    "How do I interpret correlations in health data?",
    "What's the best way to visualize population health trends?",
    "Explain statistical significance in this health context"
  ]
};

// =============================================================================
// COMPONENT
// =============================================================================

export function AIAssistantChat({
  mode = 'analysis',
  onModeChange,
  onImmersiveChange,
  initialDatasetId
}: AIAssistantChatProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<string | null>(initialDatasetId || null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<number>>(new Set());
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [showDataExplorer, setShowDataExplorer] = useState(true);
  const [dataframes, setDataframes] = useState<{
    id: string;
    name: string;
    type: 'table' | 'matrix' | 'dataframe';
    dimensions: string;
    columns: string[];
  }[]>([]);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Current mode config
  const currentMode = MODE_CONFIG[mode] || MODE_CONFIG.analysis;
  const ModeIcon = currentMode?.icon || BarChart;

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

  // Load chat history and dataframes when dataset or mode changes
  useEffect(() => {
    if (selectedDataset && userId) {
      loadChatHistory();
      loadDataframes();
    } else {
      setMessages([]);
      setDataframes([]);
    }
  }, [selectedDataset, mode, userId]);

  // Handle drill-down from Dashboard with Rich Context
  useEffect(() => {
    const state = location.state as { pinnedInsight?: any };
    if (state?.pinnedInsight) {
      const insight = state.pinnedInsight;

      // 1. Restore Dataset Context if available
      if (insight.data?.metadata?.dataset_id || insight.data?.context?.datasetId) {
        const targetDatasetId = insight.data?.metadata?.dataset_id || insight.data?.context?.datasetId;
        if (targetDatasetId !== selectedDataset) {
          setSelectedDataset(targetDatasetId);
        }
      }

      // 2. Clear state to avoid re-triggering
      window.history.replaceState({}, document.title);

      // 3. Construct Context-Aware Prompt
      let prompt = `I'm analyzing the "${insight.title}" item from my dashboard.`;

      // Use rich findings if available (PromptBI style)
      if (insight.data?.findings) {
        const findings = insight.data.findings;
        prompt += `\n\nSpecific Findings to Review:\n`;
        if (findings.correlation_coefficient) prompt += `- Correlation: ${findings.correlation_coefficient}\n`;
        if (findings.statistical_significance) prompt += `- Significance: ${findings.statistical_significance}\n`;
      }

      // Use key points
      if (insight.data?.keyPoints && insight.data.keyPoints.length > 0) {
        prompt += `\nContext:\n${insight.data.keyPoints.join('\n')}`;
      } else if (insight.data?.summary) {
        prompt += `\nContext: ${insight.data.summary}`;
      } else if (insight.description) {
        prompt += `\nContext: ${insight.description}`;
      }

      prompt += `\n\nCan you explain these patterns in more detail and showing me the raw data?`;

      // 4. Auto-send user message
      setTimeout(() => {
        setInput(prompt);
        // We set it in input so user can just hit send, or we could auto-send
        // handleSend(prompt); 
      }, 500);
    }
  }, [location.state]);

  // Auto-scroll to bottom when messages change - using scroll container directly
  useEffect(() => {
    if (scrollContainerRef.current && (messages.length > 0 || processingStep)) {
      // Scroll the container to the bottom instead of using scrollIntoView
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, processingStep]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadDataframes = useCallback(async () => {
    if (!selectedDataset) return;

    try {
      // Load dataset schema for Data Explorer
      const { data } = await supabase
        .from('datasets')
        .select('name, schema, row_count' as any)
        .eq('id', selectedDataset)
        .single();

      if (data) {
        const schema = (data as any).schema || [];
        const columns = typeof schema === 'string'
          ? JSON.parse(schema)
          : schema;

        setDataframes([{
          id: selectedDataset,
          name: data.name || 'Dataset',
          type: 'dataframe',
          dimensions: `${data.row_count || 0} × ${columns.length}`,
          columns: columns.map((c: any) => typeof c === 'string' ? c : c.name || c)
        }]);
      }
    } catch (error) {
      console.error('Error loading dataframes:', error);
    }
  }, [selectedDataset]);

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

  // Load dataset info for Data Explorer (REAL DATA)




  const saveChatMessage = useCallback(async (message: Message) => {
    if (!selectedDataset || !userId) return;

    try {
      await supabase.from('chat_history' as any).insert({
        user_id: userId,
        dataset_id: selectedDataset,
        role: message.role,
        content: message.content,
        sections: message.sections,
        mode: mode,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }, [selectedDataset, userId, mode]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading || !selectedDataset) return;

    setInput('');
    setIsLoading(true);
    setProcessingStep('Understanding your question...');

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);

    try {
      // Build context
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // Call the unified AI service
      setProcessingStep('Analyzing data...');
      const response = await labIQAI.dataAnalysis.process(
        selectedDataset,
        messageText,
        mode,
        messages.map(m => ({ role: m.role, content: m.content })),
        reasoningEnabled
      );

      // Create assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.success ? 'Analysis complete' : response.content,
        sections: response.sections,
        suggestions: response.suggestions,
        thoughtProcess: response.sections?.find(s => s.type === 'thought_process')?.items || undefined,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveChatMessage(assistantMessage);

      // Auto-pin removed per user request for cleaner experience


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
  }, [input, isLoading, selectedDataset, messages, mode, saveChatMessage, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Pin a message to dashboard
  const pinToDashboard = useCallback(async (messageIndex: number, message: Message) => {
    if (pinnedMessageIds.has(messageIndex)) {
      toast({
        title: "Already Pinned",
        description: "This insight is already on your dashboard",
      });
      return;
    }

    try {
      const title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');

      await dashboardService.autoPinFromAI(
        title,
        message.content,
        { sections: message.sections },
        selectedDataset || undefined
      );

      setPinnedMessageIds(prev => new Set([...prev, messageIndex]));

      toast({
        title: "Pinned to Dashboard",
        description: "This insight has been added to your dashboards",
      });
    } catch (error) {
      console.error('Error pinning to dashboard:', error);
      toast({
        title: "Pin Failed",
        description: "Could not pin to dashboard. Please try again.",
        variant: "destructive"
      });
    }
  }, [pinnedMessageIds, selectedDataset, toast]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Share this link to collaborate on this analysis",
      });
    } catch {
      toast({
        title: "Share",
        description: "Use the URL to share this analysis",
      });
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header - Only visible when starting a new chat (empty state) */}
        {!isLoading && messages.length === 0 && (
          <header className="flex items-center justify-between px-4 py-3 border-b bg-background animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-4">
              {/* Mode Selector */}
              <ModeSelector
                mode={mode}
                onModeChange={(m) => onModeChange?.(m)}
                variant="dropdown"
                size="md"
              />

              {/* Selected Dataset Indicator */}
              {selectedDataset && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={() => setSelectedDataset(null)}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Dataset Active
                  <ChevronDown className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </header>
        )}

        {/* Dataset Selector - Only show when no dataset selected */}
        {!selectedDataset && !isImmersive && (
          <div className="p-4 animate-fade-in border-b bg-muted/20">
            <DatasetSelector
              selectedDataset={selectedDataset}
              onSelectDataset={setSelectedDataset}
            />
          </div>
        )}

        {/* Messages Container */}
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth pb-20">
          <div className={cn(
            "mx-auto space-y-6 px-4 py-2 transition-all duration-300",
            showDataExplorer ? "max-w-5xl" : "max-w-7xl"
          )}>
            {/* Empty State - Minimal */}
            {messages.length === 0 && (
              <div className="text-center py-4 animate-fade-in opacity-0">
                {/* Content hidden */}
              </div>
            )}

            {/* Message List */}
            {/* Message List - Professional Thread Style */}
            <div className="flex flex-col gap-8 pb-8">
              {messages.map((message, i) => (
                <div key={i} className="flex gap-4 group animate-fade-in text-left">
                  {/* Avatar Column */}
                  <div className="shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${message.role === 'assistant' ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'}`}>
                      {message.role === 'assistant' ? (
                        <ModeIcon className="w-5 h-5 text-primary" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-400/30" />
                      )}
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {message.role === 'assistant' ? 'LabIQ Assistant' : 'You'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="text-base leading-relaxed text-foreground/90">
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="space-y-4">
                          {message.sections && message.sections.length > 0 ? (
                            <AIResponseRenderer
                              sections={message.sections}
                              meta={{
                                thoughtProcess: message.thoughtProcess,
                                challenges: message.challenges
                              }}
                            />
                          ) : (
                            <p className="text-foreground/80">{message.content}</p>
                          )}

                          {/* Actions Row */}
                          <div className="flex items-center gap-2 pt-2">
                            {/* Refresh Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1.5 px-2 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                // Find the last user message and resend it
                                const lastUserMsg = messages.slice(0, i).reverse().find(m => m.role === 'user');
                                if (lastUserMsg) {
                                  handleSend(lastUserMsg.content);
                                }
                              }}
                              disabled={isLoading}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Regenerate
                            </Button>

                            {/* Explainability Panel */}
                            {(message.thoughtProcess || message.role === 'assistant') && (
                              <div className="pt-2">
                                <ExplainabilityPanel
                                  thoughtProcess={message.thoughtProcess?.map((t, i) => ({
                                    step: i + 1,
                                    thought: t,
                                    reasoning: 'Analysis step',
                                    confidence: 0.9
                                  }))}
                                  findings={message.sections?.filter(s => s.type === 'insight').map(s => ({
                                    title: s.title || 'Insight',
                                    description: s.content || '',
                                    type: 'insight',
                                    confidence: 0.85
                                  }))}
                                  compact={true}
                                  confidence={0.88}
                                />
                              </div>
                            )}

                            {/* Pin Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 text-xs gap-1.5 px-2 ${pinnedMessageIds.has(i) ? 'text-green-600 bg-green-50' : 'text-muted-foreground hover:text-primary'}`}
                              onClick={() => pinToDashboard(i, message)}
                              disabled={pinnedMessageIds.has(i)}
                            >
                              {pinnedMessageIds.has(i) ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Pinned to Dashboard
                                </>
                              ) : (
                                <>
                                  <Pin className="h-3.5 w-3.5" />
                                  Pin to Dashboard
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Dynamic Suggestions */}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border/40">
                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                Suggested follow-ups
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.suggestions.map((suggestion, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSend(suggestion)}
                                    className="px-3 py-1.5 text-xs bg-background/50 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-full transition-colors border border-border/50 hover:border-primary/30 text-left shadow-sm"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading Indicator */}
            {
              isLoading && (
                <div className="flex items-center gap-3 px-6 py-4 animate-fade-in bg-muted/30 rounded-lg">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{processingStep}</span>
                </div>
              )
            }

            <div ref={messagesEndRef} />
          </div >
        </main >

        {/* Floating Input Area - Fixed at VERY bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t bg-background/95 backdrop-blur-sm z-50">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center gap-2 bg-background border border-border/40 rounded-xl shadow-sm p-2 ring-1 ring-black/5 dark:ring-white/5">

              {/* Attachment Button */}
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground shrink-0">
                <Pin className="h-5 w-5" />
              </Button>

              {/* Data Explorer Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDataExplorer(!showDataExplorer)}
                className={cn(
                  "h-10 w-10 rounded-full hover:bg-muted/50 shrink-0 transition-colors",
                  showDataExplorer ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
                title="Toggle Data Explorer"
              >
                <DatabaseIcon className="h-5 w-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedDataset ? "Ask about your health data... (e.g., 'Analyze heart rate trends')" : "Select a dataset to begin..."}
                disabled={!selectedDataset || isLoading}
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-6 px-2 placeholder:text-muted-foreground/60 h-12"
              />

              {/* Fast / Planning Toggle */}
              <div className="flex items-center gap-2 pr-2">
                <button
                  onClick={() => setReasoningEnabled(!reasoningEnabled)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border",
                    reasoningEnabled
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20 hover:bg-blue-700"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                  )}
                  title={reasoningEnabled ? "Switch to Fast Mode" : "Switch to Planning Mode"}
                >
                  {reasoningEnabled ? (
                    <Brain className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{reasoningEnabled ? "Planning" : "Fast"}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all duration-200 shadow-sm",
                    input.trim() ? "bg-primary text-primary-foreground opacity-100 scale-100" : "bg-muted text-muted-foreground opacity-50 scale-90"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Data Explorer */}
      <DataExplorerPanel
        isOpen={showDataExplorer}
        onToggle={() => setShowDataExplorer(!showDataExplorer)}
        dataframes={dataframes}
        selectedDataframeId={selectedDataset || undefined}
        thoughtProcess={messages.slice().reverse().find(m => m.role === 'assistant')?.thoughtProcess}
      />
    </div>
  );
};

export default AIAssistantChat;
