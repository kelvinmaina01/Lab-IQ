import React from 'react';
import { Card } from '@/components/ui/card';

interface UserQueryProps {
  content: string;
  timestamp?: string;
}

export const UserQuery = ({ content, timestamp }: UserQueryProps) => {
  return (
    <Card className="px-6 py-4 bg-muted/20 border-border/40 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary">Q</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {content}
          </p>
          {timestamp && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
