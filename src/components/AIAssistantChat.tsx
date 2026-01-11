/**
 * AI Assistant Chat Component
 * LabIQ Health's intelligent data analysis assistant
 * 
 * Features:
 * - Clean, professional header with Share button
 * - Storytelling insights with structured analysis
 * - Interactive charts and tables
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  RefreshCw,
  PanelRight,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { AIResponseRenderer } from './assistant/AIResponseRenderer';
import { UserQuery } from './assistant/UserQuery';
import { DataExplorerPanel } from './assistant/DataExplorerPanel';
import { AssistantPanel } from './assistant/AssistantPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

type AssistantMode = 'analyst' | 'ml' | 'learn';

interface AIAssistantChatProps {
  mode?: AssistantMode;
  onModeChange?: (mode: AssistantMode) => void;
  onImmersiveChange?: (isImmersive: boolean) => void;
  initialDatasetId?: string;
  onDatasetChange?: (datasetId: string | null) => void;
  userId: string;
  datasetId?: string;
  userAvatar?: string | null;
}

// ... (existing code)




// =============================================================================
// MODE CONFIGURATIONS
// =============================================================================

const MODE_CONFIG = {
  analyst: {
    icon: BarChart,
    color: 'text-blue-500',
    label: 'Analysis',
    description: 'Health Data Analysis'
  },
  ml: {
    icon: FlaskConical,
    color: 'text-purple-500',
    label: 'AutoML',
    description: 'Predictive Health Models'
  },
  learn: {
    icon: GraduationCap,
    color: 'text-green-500',
    label: 'Educator',
    description: 'Health Stats Education'
  }
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

export function AIAssistantChat({
  mode = 'analyst',
  onModeChange,
  onImmersiveChange,
  initialDatasetId,
  onDatasetChange,
  userId,
  datasetId,
  userAvatar
}: AIAssistantChatProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<string | null>(initialDatasetId || null);
  const [isImmersive, setIsImmersive] = useState(false);
  // userId is passed as prop
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<number>>(new Set());
  const [reasoningEnabled, setReasoningEnabled] = useState(false);

  // Sidebar State
  const [showAssistantPanel, setShowAssistantPanel] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Current mode config with safer fallback
  const currentMode = MODE_CONFIG[mode] || MODE_CONFIG.analyst;
  const ModeIcon = currentMode.icon;

  // Computed: Latest Thought Process for Planning Tab
  const currentThoughtProcess = useMemo(() => {
    // Look for the last assistant message with thought process
    const lastThinkingMessage = [...messages].reverse().find(
      m => m.role === 'assistant' && ((m.thoughtProcess?.length || 0) > 0)
    );
    return lastThinkingMessage?.thoughtProcess || [];
  }, [messages]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Update selected dataset if prop changes

  // Update selected dataset if prop changes
  useEffect(() => {
    if (initialDatasetId) {
      setSelectedDataset(initialDatasetId);
    }
  }, [initialDatasetId]);

  // Load chat history or inject mock for dev
  useEffect(() => {
    // Only inject mock if messages are empty initially
    // Mock injection disabled for production/real backend connection
    /*
    if (messages.length === 0) {
      const mockMessage: Message = {
        role: 'assistant',
        content: 'I am ready to analyze your data.',
        timestamp: new Date().toISOString(),
      };
       setMessages([mockMessage]);
    }
    */
  }, []);

  // Load chat history and dataframes when dataset or mode changes
  useEffect(() => {
    if (selectedDataset && userId) {
      loadChatHistory();
    } else {
      // Disabled clearing for debugging visibility
      // setMessages([]); 
    }
  }, [selectedDataset, mode, userId]);

  // Handle drill-down from Dashboard
  useEffect(() => {
    const state = location.state as { pinnedInsight?: any };
    if (state?.pinnedInsight) {
      const insight = state.pinnedInsight;

      if (insight.data?.metadata?.dataset_id || insight.data?.context?.datasetId) {
        const targetDatasetId = insight.data?.metadata?.dataset_id || insight.data?.context?.datasetId;
        if (targetDatasetId !== selectedDataset) {
          setSelectedDataset(targetDatasetId);
        }
      }

      window.history.replaceState({}, document.title);

      let prompt = `I'm analyzing the "${insight.title}" item from my dashboard.`;
      if (insight.data?.findings) {
        const findings = insight.data.findings;
        prompt += `\n\nSpecific Findings to Review:\n`;
        if (findings.correlation_coefficient) prompt += `- Correlation: ${findings.correlation_coefficient}\n`;
        if (findings.statistical_significance) prompt += `- Significance: ${findings.statistical_significance}\n`;
      }
      if (insight.data?.keyPoints && insight.data.keyPoints.length > 0) {
        prompt += `\nContext:\n${insight.data.keyPoints.join('\n')}`;
      } else if (insight.data?.summary) {
        prompt += `\nContext: ${insight.data.summary}`;
      } else if (insight.description) {
        prompt += `\nContext: ${insight.description}`;
      }
      prompt += `\n\nCan you explain these patterns in more detail and showing me the raw data?`;

      setTimeout(() => {
        setInput(prompt);
      }, 500);
    }
  }, [location.state]);

  // Auto-scroll
  useEffect(() => {
    if (scrollContainerRef.current && (messages.length > 0 || processingStep)) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, processingStep]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleDatasetChange = (id: string | null) => {
    setSelectedDataset(id);
    onDatasetChange?.(id);
  };

  // Helper to map frontend mode to backend/DB mode
  const mapModeToBackend = (mode: AssistantMode): 'analysis' | 'automl' | 'educator' => {
    switch (mode) {
      case 'analyst': return 'analysis';
      case 'ml': return 'automl';
      case 'learn': return 'educator';
      default: return 'analysis';
    }
  };

  const loadChatHistory = useCallback(async () => {
    if (!selectedDataset || !userId) return;

    try {
      const dbMode = mapModeToBackend(mode);
      const { data, error } = await supabase
        .from('chat_history' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('dataset_id', selectedDataset)
        .eq('mode', dbMode)
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
        // For debugging: Don't clear messages if history is empty, so mock data stays
        // setMessages([]); 
        console.log("No history found, keeping current messages");
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // setMessages([]);
    }
  }, [selectedDataset, userId, mode]);

  const saveChatMessage = useCallback(async (message: Message) => {
    if (!selectedDataset || !userId) return;

    try {
      await supabase.from('chat_history' as any).insert({
        user_id: userId,
        dataset_id: selectedDataset,
        role: message.role,
        content: message.content,
        sections: message.sections,
        mode: mapModeToBackend(mode),
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

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);

    try {
      setProcessingStep('Analyzing data...');
      const response = await labIQAI.dataAnalysis.process(
        selectedDataset,
        messageText,
        mapModeToBackend(mode),
        messages.map(m => ({ role: m.role, content: m.content })),
        reasoningEnabled
      );

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
        {/* Toggle Button for Right Sidebar if Hidden */}
        {!showRightSidebar && (
          <div className="absolute top-4 right-4 z-50">
            <Button variant="outline" size="icon" onClick={() => setShowRightSidebar(true)} className="bg-background shadow-sm hover:shadow-md transition-all">
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}        {/* Header - Only visible when starting a new chat (empty state) */}
        {!isLoading && messages.length === 0 && (
          <header className="flex items-center justify-between px-4 py-3 border-b bg-background animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-4">
              <ModeSelector
                mode={mode}
                onModeChange={(m) => onModeChange?.(m)}
                variant="dropdown"
                size="md"
              />
              {selectedDataset && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={() => handleDatasetChange(null)}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Dataset Active
                  <ChevronDown className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </header>
        )}

        {/* Dataset Selector */}
        {!selectedDataset && !isImmersive && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Active Dataset</h3>
            {selectedDataset ? (
              <div className="text-sm p-2 rounded-md bg-muted/50">
                Selected dataset active
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No dataset selected</div>
            )}
          </div>
        )}

        {/* Messages Container */}
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth pb-20">
          <div className={cn(
            "mx-auto space-y-6 px-4 py-2 transition-all duration-300",
            "max-w-7xl"
          )}>
            {messages.length === 0 && (
              <div className="text-center py-4 animate-fade-in opacity-0"></div>
            )}

            <div className="flex flex-col gap-8 pb-8">
              {messages.map((message, i) => (
                <div key={i} className="flex gap-4 group animate-fade-in text-left">
                  <div className="shrink-0 mt-1">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm overflow-hidden",
                      message.role === 'assistant' ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'
                    )}>
                      {message.role === 'assistant' ? (
                        <ModeIcon className="w-5 h-5 text-primary" />
                      ) : (
                        userAvatar ? (
                          <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-400/30 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-600">U</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {message.role === 'assistant' ? 'LabIQ Assistant' : 'You'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
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

                          {/* Footer: Date, Feedback, Actions */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
                            {/* Left: Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary rounded-full"
                                title="Export Chat"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>

                              {/* Feedback Buttons */}
                              <div className="flex items-center gap-0.5 px-2 border-l border-r border-border/40 mx-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-full"
                                  title="Good response"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                                  title="Bad response"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary rounded-full"
                                onClick={() => {
                                  const lastUserMsg = messages.slice(0, i).reverse().find(m => m.role === 'user');
                                  if (lastUserMsg) handleSend(lastUserMsg.content);
                                }}
                                disabled={isLoading}
                                title="Regenerate"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {/* Right: Timestamp */}
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                              {new Date(message.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* Suggested follow-ups */}
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

            {isLoading && (
              <div className="flex items-center gap-3 px-6 py-4 animate-fade-in bg-muted/30 rounded-lg max-w-fit mx-auto my-4 border border-border/40">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground font-medium">AI Analyst Working...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main >

        {/* Floating Input Area */}
        < div className="absolute bottom-0 left-0 right-0 p-2 border-t bg-background/95 backdrop-blur-sm z-50" >
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center gap-2 bg-background border border-border/40 rounded-xl shadow-sm p-2 ring-1 ring-black/5 dark:ring-white/5">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground shrink-0">
                <Pin className="h-5 w-5" />
              </Button>

              {/* Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAssistantPanel(!showAssistantPanel)}
                className={cn(
                  "h-10 w-10 rounded-full hover:bg-muted/50 shrink-0 transition-colors",
                  showAssistantPanel ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
                title="Toggle Assistant Panel"
              >
                <PanelRight className="h-5 w-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedDataset ? "Ask about your health data... (e.g., 'Analyze heart rate trends')" : "Select a dataset to begin..."}
                disabled={!selectedDataset || isLoading}
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-6 px-2 placeholder:text-muted-foreground/60 h-12"
              />

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
        </div >
      </div >

      {/* RIGHT SIDEBAR - AssistantPanel (same as notebook mode) */}
      <AssistantPanel
        isOpen={showRightSidebar}
        onToggle={() => setShowRightSidebar(!showRightSidebar)}
        notebook={null}
        datasetId={selectedDataset}
        userId={userId}
        currentThoughtProcess={currentThoughtProcess}
        onDatasetSelect={handleDatasetChange}
        currentMode="chat"
      />
    </div >
  );
  // Helper for Processing Steps
  // End of AIAssistantChat
};

// Helper for Processing Steps
function ProcessingStepItem({ label, status, icon }: { label: string, status: 'pending' | 'active' | 'completed', icon: React.ReactNode }) {
  return (
    <div className={cn(
      "flex items-center gap-3 transition-all duration-500",
      status === 'pending' ? "opacity-40" : "opacity-100"
    )}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors",
        status === 'completed' ? "bg-green-500 border-green-500 text-white" :
          status === 'active' ? "bg-primary border-primary text-white animate-pulse" :
            "bg-background border-border text-muted-foreground"
      )}>
        {status === 'completed' ? <Check className="w-3 h-3" /> : icon}
      </div>
      <span className={cn(
        "text-sm font-medium",
        status === 'active' ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}

export default AIAssistantChat;
