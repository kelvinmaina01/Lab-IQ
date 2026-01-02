import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, FileSpreadsheet, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OnboardingQuestionProps {
    onComplete: (mode: 'analyst' | 'ml' | 'learn') => void;
}

export const OnboardingQuestion = ({ onComplete }: OnboardingQuestionProps) => {
    const [selected, setSelected] = useState<'analyst' | 'ml' | 'learn' | null>(null);

    const options = [
        {
            id: 'analyst',
            icon: FileSpreadsheet,
            title: "Analyst",
            desc: "I want to visualize trends and analyze raw health data.",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            id: 'ml',
            icon: Brain,
            title: "Researcher",
            desc: "I want to train models and run scientific experiments.",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        },
        {
            id: 'learn',
            icon: BookOpen,
            title: "Explorer",
            desc: "I want to learn about health metrics and patterns.",
            color: "text-teal-500",
            bg: "bg-teal-500/10",
            border: "border-teal-500/20"
        }
    ] as const;

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">What brings you to LabIQ?</h2>
                <p className="text-sm text-muted-foreground">
                    We'll tailor your workspace based on your primary goal.
                </p>
            </div>

            <div className="grid gap-3">
                {options.map((option) => (
                    <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <Card
                            className={`p-4 cursor-pointer transition-all border-2 ${selected === option.id
                                    ? `${option.border} ${option.bg} border-opacity-100`
                                    : "hover:bg-muted/50 border-transparent"
                                }`}
                            onClick={() => setSelected(option.id)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${option.bg} ${option.color}`}>
                                    <option.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium leading-none">{option.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {option.desc}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Button
                className="w-full"
                size="lg"
                disabled={!selected}
                onClick={() => selected && onComplete(selected)}
            >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
};
