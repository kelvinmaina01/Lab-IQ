import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Highlight, themes } from 'prism-react-renderer';

interface AnalysisCardProps {
  thoughtProcess?: string;
  actionSummary?: string;
  code?: string;
  codeLanguage?: string;
  visualization?: React.ReactNode;
  insights?: string;
  timestamp?: string;
}

export const AnalysisCard = ({
  thoughtProcess,
  actionSummary,
  code,
  codeLanguage = 'python',
  visualization,
  insights,
  timestamp
}: AnalysisCardProps) => {
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <Card className="overflow-hidden border-border/40 bg-card shadow-sm animate-fade-in">
      {/* Thought Process - Collapsible */}
      {thoughtProcess && (
        <div className="border-b border-border/30">
          <button
            onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isThoughtExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="font-semibold text-sm">💭 Thought Process</span>
            </div>
          </button>
          {isThoughtExpanded && (
            <div className="px-6 pb-4 text-sm text-muted-foreground animate-accordion-down">
              {thoughtProcess}
            </div>
          )}
        </div>
      )}

      {/* Action Summary */}
      {actionSummary && (
        <div className="px-6 py-4 border-b border-border/30">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚙️</span>
            <div>
              <h3 className="font-semibold text-sm mb-2">Action Executed</h3>
              <p className="text-sm text-foreground">{actionSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Code Block */}
      {code && (
        <div className="border-b border-border/30">
          <div className="px-6 py-3 flex items-center justify-between bg-muted/20">
            <button
              onClick={() => setIsCodeExpanded(!isCodeExpanded)}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              {isCodeExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="font-semibold text-sm">💻 Code</span>
              <span className="text-xs text-muted-foreground ml-2">{codeLanguage}</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-7 gap-1.5"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-xs">{copiedCode ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
          {isCodeExpanded && (
            <div className="animate-accordion-down">
              <Highlight
                theme={themes.vsDark}
                code={code}
                language={codeLanguage as any}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className={className}
                    style={{
                      ...style,
                      margin: 0,
                      padding: '1.5rem',
                      fontSize: '13px',
                      background: '#1e1e1e',
                      overflow: 'auto',
                    }}
                  >
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          )}
        </div>
      )}

      {/* Visualization Output */}
      {visualization && (
        <div className="px-6 py-5 border-b border-border/30 bg-background">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">📊</span>
            <h3 className="font-semibold text-sm">Visual Output</h3>
          </div>
          <div className="animate-scale-in">{visualization}</div>
        </div>
      )}

      {/* Insights Summary */}
      {insights && (
        <div className="px-6 py-4 bg-accent/5">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <h3 className="font-semibold text-sm mb-2">Key Insights</h3>
              <div className="text-sm text-foreground leading-relaxed">
                {insights}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timestamp */}
      {timestamp && (
        <div className="px-6 py-2 text-xs text-muted-foreground bg-muted/10">
          {new Date(timestamp).toLocaleString()}
        </div>
      )}
    </Card>
  );
};
