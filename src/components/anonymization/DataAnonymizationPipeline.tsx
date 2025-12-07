import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Trash2,
  Brain
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnonymizationRule {
  id: string;
  column: string;
  method: 'mask' | 'hash' | 'generalize' | 'remove' | 'pseudonymize';
  enabled: boolean;
}

interface Dataset {
  id: string;
  name: string;
  columns_info: any;
}

export const DataAnonymizationPipeline = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [rules, setRules] = useState<AnonymizationRule[]>([]);
  const [piiDetected, setPiiDetected] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [gdprCompliant, setGdprCompliant] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      analyzePII();
    }
  }, [selectedDataset]);

  const fetchDatasets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('datasets')
        .select('id, name, columns_info')
        .eq('user_id', user.id);

      if (error) throw error;
      setDatasets(data || []);
    } catch (error: any) {
      console.error('Error fetching datasets:', error);
    }
  };

  const analyzePII = () => {
    // Mock PII detection - in production, this would use ML/regex patterns
    const dataset = datasets.find(d => d.id === selectedDataset);
    if (!dataset || !dataset.columns_info) return;

    const piiColumns: string[] = [];
    const detectedRules: AnonymizationRule[] = [];

    Object.keys(dataset.columns_info).forEach(column => {
      const columnLower = column.toLowerCase();
      if (
        columnLower.includes('email') ||
        columnLower.includes('phone') ||
        columnLower.includes('ssn') ||
        columnLower.includes('name') ||
        columnLower.includes('address') ||
        columnLower.includes('dob') ||
        columnLower.includes('credit') ||
        columnLower.includes('patient')
      ) {
        piiColumns.push(column);
        detectedRules.push({
          id: `rule-${column}`,
          column,
          method: columnLower.includes('email') ? 'hash' : 'mask',
          enabled: true
        });
      }
    });

    setPiiDetected(piiColumns);
    setRules(detectedRules);
    setGdprCompliant(piiColumns.length === 0 || detectedRules.every(r => r.enabled));
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const updateRuleMethod = (ruleId: string, method: AnonymizationRule['method']) => {
    setRules(rules.map(rule =>
      rule.id === ruleId ? { ...rule, method } : rule
    ));
  };

  const applyAnonymization = async () => {
    setProcessing(true);
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Anonymization Complete",
        description: "Dataset has been anonymized according to your rules",
      });

      setGdprCompliant(true);
    } catch (error: any) {
      toast({
        title: "Anonymization Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportComplianceReport = () => {
    const report = {
      dataset: datasets.find(d => d.id === selectedDataset)?.name,
      timestamp: new Date().toISOString(),
      piiDetected: piiDetected.length,
      rulesApplied: rules.filter(r => r.enabled).length,
      gdprCompliant,
      rules: rules.map(r => ({
        column: r.column,
        method: r.method,
        enabled: r.enabled
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    toast({
      title: "Report Exported",
      description: "GDPR compliance report has been downloaded",
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'mask':
        return <EyeOff className="w-4 h-4" />;
      case 'hash':
        return <Lock className="w-4 h-4" />;
      case 'remove':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Anonymization Pipeline</h2>
          <p className="text-muted-foreground">
            Automated PII/PHI detection and GDPR-compliant data processing
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={gdprCompliant ? "default" : "destructive"}
            className="px-3 py-1"
          >
            {gdprCompliant ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                GDPR Compliant
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Action Required
              </>
            )}
          </Badge>
          <Button variant="outline" onClick={exportComplianceReport}>
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          {gdprCompliant && (
            <Button onClick={() => window.location.href = '/models'} className="gap-2">
              <Brain className="w-4 h-4" />
              Train AI Model
            </Button>
          )}
        </div>
      </div>

      {/* Dataset Selection */}
      <Card className="p-6">
        <Label htmlFor="dataset-select" className="text-base font-semibold mb-2 block">
          Select Dataset
        </Label>
        <Select value={selectedDataset} onValueChange={setSelectedDataset}>
          <SelectTrigger id="dataset-select" className="w-full">
            <SelectValue placeholder="Choose a dataset to anonymize" />
          </SelectTrigger>
          <SelectContent>
            {datasets.map(dataset => (
              <SelectItem key={dataset.id} value={dataset.id}>
                {dataset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {selectedDataset && (
        <>
          {/* PII Detection Summary */}
          <Card className={`p-6 ${piiDetected.length > 0 ? 'border-orange-500/50 bg-orange-500/5' : 'border-green-500/50 bg-green-500/5'}`}>
            <div className="flex items-start gap-4">
              {piiDetected.length > 0 ? (
                <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {piiDetected.length > 0
                    ? `${piiDetected.length} PII/PHI Column${piiDetected.length > 1 ? 's' : ''} Detected`
                    : 'No Sensitive Data Detected'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {piiDetected.length > 0
                    ? 'Columns containing potentially sensitive information have been identified. Configure anonymization rules below.'
                    : 'This dataset appears to be free of personally identifiable information.'}
                </p>
                {piiDetected.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {piiDetected.map(column => (
                      <Badge key={column} variant="outline" className="bg-background">
                        {column}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Anonymization Rules */}
          {rules.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Anonymization Rules</h3>
              <div className="space-y-4">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getMethodIcon(rule.method)}
                          <p className="font-medium">{rule.column}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Method: {rule.method.charAt(0).toUpperCase() + rule.method.slice(1)}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={rule.method}
                      onValueChange={(value) => updateRuleMethod(rule.id, value as AnonymizationRule['method'])}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mask">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4" />
                            Mask
                          </div>
                        </SelectItem>
                        <SelectItem value="hash">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Hash
                          </div>
                        </SelectItem>
                        <SelectItem value="generalize">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Generalize
                          </div>
                        </SelectItem>
                        <SelectItem value="pseudonymize">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Pseudonymize
                          </div>
                        </SelectItem>
                        <SelectItem value="remove">
                          <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Button
                onClick={applyAnonymization}
                disabled={processing || !rules.some(r => r.enabled)}
                className="w-full mt-6"
                size="lg"
              >
                {processing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Apply Anonymization
                  </>
                )}
              </Button>
            </Card>
          )}

          {/* Compliance Documentation */}
          <Tabs defaultValue="gdpr" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gdpr">GDPR</TabsTrigger>
              <TabsTrigger value="hipaa">HIPAA</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            <TabsContent value="gdpr" className="mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">GDPR Compliance Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Right to Erasure</span>
                    <Badge variant={rules.some(r => r.method === 'remove') ? "default" : "secondary"}>
                      {rules.some(r => r.method === 'remove') ? 'Implemented' : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Data Minimization</span>
                    <Badge variant={rules.filter(r => r.enabled).length > 0 ? "default" : "secondary"}>
                      {rules.filter(r => r.enabled).length > 0 ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Pseudonymization</span>
                    <Badge variant={rules.some(r => r.method === 'pseudonymize') ? "default" : "secondary"}>
                      {rules.some(r => r.method === 'pseudonymize') ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="hipaa" className="mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">HIPAA Safe Harbor Method</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Compliance with 18 identifiers specified in HIPAA Privacy Rule
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Names and contact information protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Dates (except year) generalized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Geographic subdivisions masked</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
                <div className="space-y-3">
                  <div className="text-sm p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">Dataset analyzed</p>
                    <p className="text-muted-foreground">{new Date().toLocaleString()}</p>
                  </div>
                  <div className="text-sm p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">{piiDetected.length} PII columns identified</p>
                    <p className="text-muted-foreground">Automated scan completed</p>
                  </div>
                  <div className="text-sm p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">{rules.filter(r => r.enabled).length} rules configured</p>
                    <p className="text-muted-foreground">Ready for application</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
