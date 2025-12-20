import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  TrendingUp,
  Brain,
  FileText,
  Send,
  Loader2,
  Lightbulb,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { useServices } from '@/core/ServiceProvider';
import { toast } from 'sonner';

interface CollaborativeInsightsProps {
  channelId: string;
  labId: string;
}

export const CollaborativeInsights = ({ channelId, labId }: CollaborativeInsightsProps) => {
  const { collaboration } = useServices();
  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState<any>(null);

  const handleGenerateInsight = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question or topic');
      return;
    }

    setGenerating(true);

    try {
      // Send message with @LabAI mention to trigger AI
      await collaboration.sendMessage(channelId, `@LabAI ${question.trim()}`);

      toast.success('AI is analyzing...', {
        description: 'Response will appear in the chat shortly',
        icon: <Sparkles className="h-4 w-4" />
      });

      setQuestion('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send question to AI');
    } finally {
      setGenerating(false);
    }
  };

  const quickPrompts = [
    {
      icon: BarChart3,
      title: 'Analyze Data Trends',
      prompt: 'What are the key trends in our recent experimental data?',
      color: 'text-blue-500'
    },
    {
      icon: Lightbulb,
      title: 'Generate Hypothesis',
      prompt: 'Based on our data, what hypotheses should we test next?',
      color: 'text-yellow-500'
    },
    {
      icon: TrendingUp,
      title: 'Statistical Summary',
      prompt: 'Provide a statistical summary of our dataset correlations',
      color: 'text-green-500'
    },
    {
      icon: FileText,
      title: 'Create Report',
      prompt: 'Generate a summary report of our team\'s findings this week',
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-primary" />
          Collaborative AI Insights
        </h3>
        <p className="text-sm text-muted-foreground">
          Ask @LabAI questions about your data, generate insights, or get analysis suggestions
        </p>
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quickPrompts.map((prompt, idx) => {
          const Icon = prompt.icon;
          return (
            <Card
              key={idx}
              className="p-4 cursor-pointer hover:border-primary transition-all hover:shadow-md group"
              onClick={() => setQuestion(prompt.prompt)}
            >
              <div className="flex items-start gap-3">
                <div className={`${prompt.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1">{prompt.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{prompt.prompt}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Custom Question */}
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Ask a Custom Question
          </label>
          <Textarea
            placeholder="Example: What are the p-values for our latest experiment? or Summarize our team's key findings..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={generating}
          />
        </div>

        <Button
          onClick={handleGenerateInsight}
          disabled={!question.trim() || generating}
          className="w-full gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Ask @LabAI
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          AI response will appear in the channel chat
        </p>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Collaborative AI Features</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Mention @LabAI in any channel to get instant analysis</li>
              <li>• AI can analyze datasets, suggest experiments, and generate reports</li>
              <li>• All team members can see AI responses in the channel</li>
              <li>• AI learns from your lab's data and preferences</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
