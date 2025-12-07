import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Play,
    Plus,
    Trash2,
    ArrowRight,
    Upload,
    Database,
    Brain,
    Mail,
    FileDown,
    CheckCircle2
} from 'lucide-react';

interface WorkflowStep {
    id: string;
    type: 'quality_check' | 'transform' | 'train_model' | 'analyze' | 'notify' | 'export';
    config: Record<string, any>;
}

interface WorkflowBuilderProps {
    onSave?: (workflow: any) => void;
    onCancel?: () => void;
    initialDatasetId?: string;
}

const stepTypes = [
    {
        id: 'quality_check',
        name: 'Quality Check',
        icon: CheckCircle2,
        description: 'Verify data quality meets threshold',
        config: { threshold: 80 }
    },
    {
        id: 'transform',
        name: 'Data Transform',
        icon: Database,
        description: 'Apply data transformations',
        config: { operations: [] }
    },
    {
        id: 'train_model',
        name: 'Train ML Model',
        icon: Brain,
        description: 'Auto-train machine learning model',
        config: { auto_detect: true }
    },
    {
        id: 'analyze',
        name: 'AI Analysis',
        icon: Brain,
        description: 'Generate AI insights',
        config: { mode: 'analysis' }
    },
    {
        id: 'notify',
        name: 'Send Notification',
        icon: Mail,
        description: 'Email notification',
        config: { recipients: [] }
    },
    {
        id: 'export',
        name: 'Export Results',
        icon: FileDown,
        description: 'Export to CSV/Excel',
        config: { format: 'csv' }
    }
];

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
    onSave,
    onCancel,
    initialDatasetId
}) => {
    const [workflowName, setWorkflowName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState('dataset_upload');
    const [steps, setSteps] = useState<WorkflowStep[]>([]);

    const addStep = (typeId: string) => {
        const stepType = stepTypes.find(t => t.id === typeId);
        if (!stepType) return;

        const newStep: WorkflowStep = {
            id: `step_${Date.now()}`,
            type: typeId as any,
            config: { ...stepType.config }
        };

        setSteps([...steps, newStep]);
    };

    const removeStep = (stepId: string) => {
        setSteps(steps.filter(s => s.id !== stepId));
    };

    const handleSave = () => {
        const workflow = {
            name: workflowName,
            description,
            trigger_type: triggerType,
            trigger_config: initialDatasetId ? { dataset_id: initialDatasetId } : {},
            steps: steps.map(s => ({
                type: s.type,
                config: s.config
            })),
            status: 'active'
        };

        onSave?.(workflow);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle>Create Workflow</CardTitle>
                    <CardDescription>
                        Automate your data processing pipeline with sequential steps
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="workflow-name">Workflow Name</Label>
                        <Input
                            id="workflow-name"
                            placeholder="e.g., Auto-ML Pipeline"
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what this workflow does..."
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trigger">Trigger</Label>
                        <Select value={triggerType} onValueChange={setTriggerType}>
                            <SelectTrigger id="trigger">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dataset_upload">When Dataset is Uploaded</SelectItem>
                                <SelectItem value="manual">Manual Trigger</SelectItem>
                                <SelectItem value="schedule">Scheduled (Pro)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Steps */}
            <Card>
                <CardHeader>
                    <CardTitle>Workflow Steps</CardTitle>
                    <CardDescription>
                        Add steps that will execute in sequence
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {steps.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No steps added yet</p>
                            <p className="text-sm">Add your first step below</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {steps.map((step, index) => {
                                const stepType = stepTypes.find(t => t.id === step.type);
                                const Icon = stepType?.icon || Database;

                                return (
                                    <div key={step.id}>
                                        <Card className="relative">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Icon className="h-5 w-5 text-primary" />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                Step {index + 1}
                                                            </Badge>
                                                            <h4 className="font-medium">{stepType?.name}</h4>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {stepType?.description}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeStep(step.id)}
                                                        className="text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {index < steps.length - 1 && (
                                            <div className="flex justify-center py-2">
                                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <Separator className="my-4" />

                    {/* Add Step Buttons */}
                    <div className="space-y-2">
                        <Label>Add Step</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {stepTypes.map((stepType) => {
                                const Icon = stepType.icon;
                                return (
                                    <Button
                                        key={stepType.id}
                                        variant="outline"
                                        className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-primary/5"
                                        onClick={() => addStep(stepType.id)}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-xs">{stepType.name}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!workflowName || steps.length === 0}
                >
                    <Play className="mr-2 h-4 w-4" />
                    Create Workflow
                </Button>
            </div>
        </div>
    );
};
