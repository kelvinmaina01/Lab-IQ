import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MLModel } from '@/pages/Models';
import { mlService } from '@/lib/services/mlService';
import { toast } from '@/components/ui/use-toast';
import { Loader2, PlayCircle } from 'lucide-react';

interface PredictionDialogProps {
    model: MLModel | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PredictionDialog: React.FC<PredictionDialogProps> = ({
    model,
    open,
    onOpenChange,
}) => {
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!model) return null;

    const handleInputChange = (feature: string, value: string) => {
        setInputs(prev => ({ ...prev, [feature]: value }));
    };

    const handlePredict = async () => {
        if (!model.metrics?.model_path) {
            toast({
                title: "Model Path Missing",
                description: "Cannot find the trained model file. Please retrain.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            // Convert inputs to numbers where possible
            const formattedInput: Record<string, any> = {};
            model.features.forEach(f => {
                const val = inputs[f];
                formattedInput[f] = isNaN(Number(val)) ? val : Number(val);
            });

            const response = await mlService.predict({
                model_id: model.id,
                model_path: model.metrics.model_path,
                input_data: [formattedInput]
            });

            if (response.success && response.predictions) {
                setResult(response.predictions[0]);
                toast({
                    title: "Prediction Successful",
                    description: `Result: ${response.predictions[0]}`
                });
            }
        } catch (error: any) {
            console.error("Prediction error:", error);
            toast({
                title: "Prediction Failed",
                description: error.message || "Could not generate prediction",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Test Model: {model.name}</DialogTitle>
                    <DialogDescription>
                        Enter values for the features to generate a real-time prediction.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    {model.features.map(feature => (
                        <div key={feature} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={feature} className="text-right">
                                {feature}
                            </Label>
                            <Input
                                id={feature}
                                className="col-span-3"
                                placeholder={`Enter ${feature}`}
                                value={inputs[feature] || ''}
                                onChange={(e) => handleInputChange(feature, e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                {result !== null && (
                    <div className="bg-muted p-4 rounded-md text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Prediction Result</p>
                        <p className="text-2xl font-bold text-primary">{
                            typeof result === 'number' ? result.toFixed(4) : result
                        }</p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handlePredict} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        Run Prediction
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
