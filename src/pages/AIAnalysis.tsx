import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { labIQAI } from "@/lib/ai/LabIQAI"; // Using the robust AI service

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MLModel {
  id: string;
  name: string;
  type: string;
  status: string;
}

const AIAnalysis = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [models, setModels] = useState<MLModel[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('models') // Use 'models' table as established in Models.tsx
      .select('id, name, type, status')
      .eq('user_id', user.id)
      .eq('status', 'completed'); // Only show trained models

    if (error) {
      console.error('Error fetching models:', error);
    } else {
      setModels(data || []);
      if (data && data.length > 0) {
        setSelectedModelId(data[0].id);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsProcessing(true);

    try {
      // Find selected model context
      const model = models.find(m => m.id === selectedModelId);
      const context = model ? `Acting as the trained model: ${model.name} (${model.type}).` : "General analysis mode.";

      // Call AI Service
      const response = await labIQAI.generateAnalysis(
        inputValue,
        context, 
        'concise' // Default mode
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
       console.error(error);
       toast({
         title: "Error",
         description: "Failed to generate AI response.",
         variant: "destructive"
       });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-8 bg-muted/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                AI Analysis & Chat
              </h1>
              <p className="text-muted-foreground">Chat with your trained models to gain insights</p>
            </div>
            
            {/* Model Selector */}
            <div className="w-[300px]">
               <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                 <SelectTrigger className="bg-background">
                   <SelectValue placeholder="Select a trained model..." />
                 </SelectTrigger>
                 <SelectContent>
                   {models.length === 0 ? (
                     <SelectItem value="none" disabled>No trained models found</SelectItem>
                   ) : (
                     models.map(m => (
                       <SelectItem key={m.id} value={m.id}>
                         <div className="flex items-center gap-2">
                           <Brain className="w-4 h-4 text-primary" />
                           {m.name}
                         </div>
                       </SelectItem>
                     ))
                   )}
                 </SelectContent>
               </Select>
            </div>
          </div>

          {/* Chat Interface */}
          <Card className="flex-1 flex flex-col overflow-hidden bg-background shadow-sm border-border/60">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                  <Bot className="w-16 h-16" />
                  <p>Select a model and start asking questions about predictions or data patterns.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-muted rounded-bl-none prose prose-sm dark:prose-invert'
                      }`}>
                        {msg.content}
                      </div>
                       {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3">
                          Thinking...
                        </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-muted/20">
              <div className="max-w-3xl mx-auto flex gap-3">
                <Textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question about the model's predictions..."
                  className="min-h-[50px] resize-none border-primary/20 focus-visible:ring-primary shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim() || isProcessing}
                  className="h-[50px] w-[50px] shrink-0 rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                AI analysis may hallucinate. Verify critical predictions.
              </p>
            </div>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default AIAnalysis;
