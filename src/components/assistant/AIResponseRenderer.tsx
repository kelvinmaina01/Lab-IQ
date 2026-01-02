/**
 * AI Response Renderer - Julius AI Style
 * Features:
 * - Collapsible Thought Process section
 * - Collapsible Challenges section
 * - Interactive charts with type switching
 * - Data tables with pagination and export
 * - Code blocks with explanation
 * - Structured insight sections
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Settings2,
  AlertTriangle,
  Code2,
  BarChart3,
  Table as TableIcon,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InteractiveChartCard } from '@/components/dashboard/InteractiveChartCard';
import { InteractiveDataTable } from '@/components/dashboard/InteractiveDataTable';
import { ThoughtProcess, Challenges, CodeExplanation, InsightBlock } from '@/components/dashboard/AIThoughtProcess';

// =============================================================================
// TYPES
// =============================================================================

interface ChartData {
  labels: string[];
  values: number[];
}

interface TableData {
  columns?: string[];
  rows: Record<string, any>[];
}

interface AnalysisData {
  overview?: string;
  keyFindings?: string[];
  recommendations?: string[];
}

export interface Section {
  type: 'heading' | 'paragraph' | 'list' | 'chart' | 'insight' | 'table' | 'code' | 'metric' | 'kpi_grid' | 'thought_process' | 'recommendation';
  content?: string;
  title?: string;
  items?: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'heatmap';
  data?: ChartData;
  tableData?: TableData;
  code?: string;
  language?: string;
  codeExplanation?: string;
  codeSteps?: string[];
  analysis?: AnalysisData;
  xLabel?: string;
  yLabel?: string;
  // KPI specific
  kpis?: { title: string; value: string | number; trend?: 'up' | 'down' | 'stable'; change?: string }[];
}

interface AIResponseMeta {
  thoughtProcess?: string[];
  challenges?: string[];
}

interface AIResponseRendererProps {
  sections: Section[];
  meta?: AIResponseMeta;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const AIResponseRenderer = ({ sections, meta }: AIResponseRendererProps) => {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setOpenSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4">
      {/* Thought Process - Julius AI Style */}
      {meta?.thoughtProcess && meta.thoughtProcess.length > 0 && (
        <ThoughtProcess steps={meta.thoughtProcess} />
      )}

      {/* Challenges - Julius AI Style */}
      {meta?.challenges && meta.challenges.length > 0 && (
        <Challenges challenges={meta.challenges} />
      )}

      {/* Main Content Sections */}
      {sections.map((section, i) => {
        const isOpen = openSections[i] !== false;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            {/* Heading */}
            {section.type === 'heading' && (
              <h2 className="text-xl font-semibold text-foreground py-2">
                {section.content}
              </h2>
            )}

            {/* Paragraph */}
            {section.type === 'paragraph' && (
              <p className="text-base text-foreground/90 leading-relaxed py-2">
                {section.content}
              </p>
            )}

            {/* List - Julius AI Clean Pill Style */}
            {section.type === 'list' && (
              <div className="space-y-3 py-2">
                {section.title && (
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-2">
                  {section.items?.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group flex items-center justify-between p-4 bg-background border border-border/50 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/20"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart - Interactive with Type Switching */}
            {section.type === 'chart' && section.data && (
              <InteractiveChartCard
                title={section.title || 'Data Visualization'}
                data={{
                  labels: section.data.labels || [],
                  datasets: [{
                    label: section.yLabel || 'Value',
                    data: section.data.values || []
                  }]
                }}
                defaultChartType={section.chartType || 'bar'}
                analysis={section.analysis ? {
                  title: `Chart Analysis: ${section.title || 'Data Visualization'}`,
                  content: section.analysis.overview || '',
                  keyFindings: section.analysis.keyFindings
                } : undefined}
              />
            )}

            {/* Table - Interactive with Pagination */}
            {section.type === 'table' && section.tableData && (
              <InteractiveDataTable
                title={section.title || 'Data Table'}
                data={section.tableData.rows}
                columns={section.tableData.columns}
                pageSize={5}
              />
            )}

            {/* Code Block - Julius AI Style */}
            {section.type === 'code' && (
              <CodeExplanation
                title={section.title || 'Code Analysis'}
                code={section.code}
                language={section.language || 'python'}
                explanation={section.codeExplanation || ''}
                steps={section.codeSteps}
              />
            )}

            {/* Insight - Clean Modern Style */}
            {section.type === 'insight' && (
              <motion.div
                className="my-4 rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden"
                whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
              >
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(i)}>
                  <div className="p-1">
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                          {section.title || 'Key Insight'}
                        </h3>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="px-6 pb-6 pt-2 space-y-4">
                      {/* Main Content */}
                      {section.content && (
                        <p className="text-foreground/80 leading-relaxed text-sm">
                          {section.content}
                        </p>
                      )}

                      {/* Why This Matters */}
                      {section.analysis?.overview && (
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Why This Matters
                          </h4>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {section.analysis.overview}
                          </p>
                        </div>
                      )}

                      {/* Key Trends / Findings */}
                      {section.analysis?.keyFindings && section.analysis.keyFindings.length > 0 && (
                        <InsightBlock
                          title="Key Trends"
                          icon={<TrendingUp className="h-4 w-4 text-primary" />}
                          content=""
                          bulletPoints={section.analysis.keyFindings}
                        />
                      )}

                      {/* Recommendations */}
                      {section.analysis?.recommendations && section.analysis.recommendations.length > 0 && (
                        <div className="pt-4 border-t border-border/50">
                          <InsightBlock
                            title="Recommendations"
                            content=""
                            bulletPoints={section.analysis.recommendations}
                          />
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            )}
            {/* KPI Grid - PromptBI Style */}
            {section.type === 'kpi_grid' && section.kpis && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                {section.kpis.map((kpi, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.title}</span>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</span>
                      {kpi.trend && (
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                          kpi.trend === 'up' ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                            kpi.trend === 'down' ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground"
                        )}>
                          {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : kpi.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                          {kpi.change}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Thought Process Section (inline) */}
            {section.type === 'thought_process' && section.items && (
              <ThoughtProcess steps={section.items} />
            )}

            {/* Recommendation - High Impact Style */}
            {section.type === 'recommendation' && (
              <motion.div
                className="my-4 p-5 rounded-xl border border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-500 text-white shadow-md">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {section.title || 'Actionable Recommendation'}
                    </h3>
                    <p className="text-base text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                      {section.content}
                    </p>
                    {section.items && section.items.length > 0 && (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-sm items-center bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/50">
                            <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-blue-900/90 dark:text-blue-100/90 font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default AIResponseRenderer;
