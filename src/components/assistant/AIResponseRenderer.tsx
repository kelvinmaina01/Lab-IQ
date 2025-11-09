import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ChartSection {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie';
  data: {
    labels: string[];
    values: number[];
  };
  xLabel?: string;
  yLabel?: string;
  title?: string;
}

interface ListSection {
  type: 'list';
  title?: string;
  items: string[];
}

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

interface AIResponseRendererProps {
  sections: Section[];
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8b5cf6', '#f59e0b'];

export const AIResponseRenderer = ({ sections }: AIResponseRendererProps) => {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setOpenSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const shouldBeCollapsible = (section: Section) => {
    return section.type === 'chart' || section.type === 'list' || section.type === 'insight';
  };

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const isCollapsible = shouldBeCollapsible(section);
        const isOpen = openSections[i] !== false;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="shadow-sm border-border/40 overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-0">
                {section.type === 'heading' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      {section.content}
                    </h2>
                  </div>
                )}

                {section.type === 'paragraph' && (
                  <div className="p-6">
                    <p className="text-base text-foreground/90 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                )}

                {section.type === 'list' && (
                  <Collapsible open={isOpen} onOpenChange={() => toggleSection(i)}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors">
                      <h3 className="text-lg font-medium text-foreground">
                        {section.title || 'List'}
                      </h3>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-6 pb-6">
                      <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                        {section.items?.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                )}

              {section.type === 'chart' && section.data && (
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(i)}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors">
                    <h3 className="text-lg font-medium text-foreground">
                      {section.title || `${section.chartType?.toUpperCase()} Chart`}
                    </h3>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 pb-6">
                    <div className="w-full h-80">
                    {section.chartType === 'bar' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={section.data.labels.map((label, idx) => ({
                            label,
                            value: section.data!.values[idx],
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="label" 
                            label={section.xLabel ? { value: section.xLabel, position: 'bottom', offset: 0 } : undefined}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            label={section.yLabel ? { value: section.yLabel, angle: -90, position: 'insideLeft' } : undefined}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {section.chartType === 'line' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={section.data.labels.map((label, idx) => ({
                            label,
                            value: section.data!.values[idx],
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="label"
                            label={section.xLabel ? { value: section.xLabel, position: 'bottom', offset: 0 } : undefined}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            label={section.yLabel ? { value: section.yLabel, angle: -90, position: 'insideLeft' } : undefined}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}

                    {section.chartType === 'pie' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={section.data.labels.map((label, idx) => ({
                              name: label,
                              value: section.data!.values[idx],
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="hsl(var(--primary))"
                            dataKey="value"
                          >
                            {section.data.labels.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {section.type === 'insight' && (
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(i)}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between p-6 bg-primary/5 hover:bg-primary/10 transition-colors border-l-4 border-primary">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-medium text-foreground">Key Insight</h3>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-primary" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 py-4 bg-primary/5">
                    <p className="text-foreground/90 leading-relaxed">
                      {section.content}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
