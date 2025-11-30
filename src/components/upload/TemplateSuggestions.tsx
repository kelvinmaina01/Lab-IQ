import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface TemplateSuggestionProps {
    suggestedTemplateIds: string[];
}

// This should match the templates in ExperimentTemplates.tsx
// In a real app, this data would come from a database or shared constant
const TEMPLATE_DATA: Record<string, any> = {
    "chem-synthesis": { name: "Chemical Synthesis", type: "Chemistry", isPro: false },
    "chem-titration": { name: "Acid-Base Titration", type: "Chemistry", isPro: false },
    "bio-microscopy": { name: "Microscopy Observation", type: "Biology", isPro: false },
    "bio-enzyme": { name: "Enzyme Activity Analysis", type: "Biology", isPro: true },
    "bio-dna": { name: "DNA Extraction & Analysis", type: "Biology", isPro: true },
    "phys-mechanics": { name: "Classical Mechanics", type: "Physics", isPro: false },
    "phys-optics": { name: "Optics & Light", type: "Physics", isPro: true },
    "phys-circuits": { name: "Electrical Circuits", type: "Physics", isPro: false },
};

export const TemplateSuggestions = ({ suggestedTemplateIds }: TemplateSuggestionProps) => {
    const navigate = useNavigate();
    const { subscription } = useSubscription();

    if (suggestedTemplateIds.length === 0) return null;

    return (
        <Card className="border-purple-500/20 bg-purple-500/5 p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                    AI Recommendations
                </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                Based on your file, these experiment templates might be useful:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedTemplateIds.slice(0, 2).map(id => {
                    const template = TEMPLATE_DATA[id];
                    if (!template) return null;

                    const isLocked = template.isPro && subscription?.tier === "free";

                    return (
                        <div key={id} className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-purple-500/50 transition-colors">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{template.name}</span>
                                    {template.isPro && <Badge variant="secondary" className="text-xs">Pro</Badge>}
                                </div>
                                <span className="text-xs text-muted-foreground">{template.type}</span>
                            </div>
                            <Button
                                size="sm"
                                variant={isLocked ? "outline" : "default"}
                                className="gap-2"
                                onClick={() => navigate(`/experiments?template=${id}`)}
                            >
                                {isLocked ? <Lock className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                                {isLocked ? "Unlock" : "Use"}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
