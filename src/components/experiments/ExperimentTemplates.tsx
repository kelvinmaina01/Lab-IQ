import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Dna, Atom, Microscope, BookOpen, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description: string;
  discipline: "chemistry" | "biology" | "physics" | "general";
  sections: string[];
  isPro: boolean;
  isPopular?: boolean;
}

interface ExperimentTemplatesProps {
  onSelectTemplate: (template: Template) => void;
  onUpgradeClick: () => void;
}

export const ExperimentTemplates = ({ onSelectTemplate, onUpgradeClick }: ExperimentTemplatesProps) => {
  const { subscription } = useSubscription();
  const { toast } = useToast();

  const templates: Template[] = [
    {
      id: "chem-synthesis",
      name: "Chemical Synthesis",
      description: "Standard template for chemical compound synthesis experiments",
      discipline: "chemistry",
      sections: ["Objective", "Materials & Reagents", "Procedure", "Safety Precautions", "Observations", "Results", "Calculations", "Discussion", "References"],
      isPro: false,
      isPopular: true
    },
    {
      id: "chem-titration",
      name: "Acid-Base Titration",
      description: "Template for titration experiments with calculations",
      discipline: "chemistry",
      sections: ["Objective", "Theory", "Materials", "Procedure", "Data Table", "Calculations", "Results", "Conclusion"],
      isPro: false
    },
    {
      id: "bio-microscopy",
      name: "Microscopy Observation",
      description: "Detailed template for biological microscopy studies",
      discipline: "biology",
      sections: ["Objective", "Materials", "Specimen Preparation", "Observation Protocol", "Diagrams/Images", "Cellular Structures Identified", "Analysis", "Conclusion"],
      isPro: false,
      isPopular: true
    },
    {
      id: "bio-enzyme",
      name: "Enzyme Activity Analysis",
      description: "Template for studying enzyme kinetics and activity",
      discipline: "biology",
      sections: ["Objective", "Hypothesis", "Materials", "Methodology", "Data Collection", "Enzyme Kinetics Analysis", "Graphs", "Discussion", "Conclusion"],
      isPro: true
    },
    {
      id: "bio-dna",
      name: "DNA Extraction & Analysis",
      description: "Comprehensive template for molecular biology experiments",
      discipline: "biology",
      sections: ["Objective", "Materials", "Extraction Protocol", "Purity Assessment", "Gel Electrophoresis", "Results", "Data Analysis", "Conclusion"],
      isPro: true
    },
    {
      id: "phys-mechanics",
      name: "Classical Mechanics",
      description: "Template for physics experiments on motion and forces",
      discipline: "physics",
      sections: ["Objective", "Theory", "Apparatus", "Procedure", "Measurements", "Calculations", "Error Analysis", "Graphs", "Conclusion"],
      isPro: false
    },
    {
      id: "phys-optics",
      name: "Optics & Light",
      description: "Template for optics experiments and light phenomena",
      discipline: "physics",
      sections: ["Objective", "Theory", "Apparatus Setup", "Procedure", "Observations", "Data & Calculations", "Analysis", "Conclusion"],
      isPro: true
    },
    {
      id: "phys-circuits",
      name: "Electrical Circuits",
      description: "Template for circuit analysis and electrical measurements",
      discipline: "physics",
      sections: ["Objective", "Circuit Diagram", "Components", "Procedure", "Measurements", "Calculations", "Analysis", "Conclusion"],
      isPro: false,
      isPopular: true
    },
    {
      id: "general-lab",
      name: "General Lab Report",
      description: "Universal template for any type of experiment",
      discipline: "general",
      sections: ["Title", "Objective", "Introduction", "Materials", "Methodology", "Results", "Discussion", "Conclusion", "References"],
      isPro: false
    }
  ];

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case "chemistry":
        return <FlaskConical className="w-5 h-5" />;
      case "biology":
        return <Dna className="w-5 h-5" />;
      case "physics":
        return <Atom className="w-5 h-5" />;
      default:
        return <Microscope className="w-5 h-5" />;
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case "chemistry":
        return "bg-blue-500/10 text-blue-500";
      case "biology":
        return "bg-green-500/10 text-green-500";
      case "physics":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const handleUseTemplate = (template: Template) => {
    if (template.isPro && subscription?.tier === "free") {
      onUpgradeClick();
      toast({
        title: "Pro Feature",
        description: `The ${template.name} template requires a Pro subscription.`,
        variant: "destructive"
      });
      return;
    }
    onSelectTemplate(template);
    toast({
      title: "Template Selected",
      description: `Using ${template.name} template.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Experiment Templates Library</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${getDisciplineColor(template.discipline)}`}>
                {getDisciplineIcon(template.discipline)}
              </div>
              <div className="flex items-center gap-1">
                {template.isPopular && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="w-3 h-3" />
                    Popular
                  </Badge>
                )}
                {template.isPro && (
                  <Badge variant="outline">Pro</Badge>
                )}
              </div>
            </div>

            <h4 className="font-semibold mb-1">{template.name}</h4>
            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
            
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Includes {template.sections.length} sections:</p>
              <div className="flex flex-wrap gap-1">
                {template.sections.slice(0, 4).map((section, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {section}
                  </Badge>
                ))}
                {template.sections.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.sections.length - 4} more
                  </Badge>
                )}
              </div>
            </div>

            <Button 
              onClick={() => handleUseTemplate(template)} 
              className="w-full"
              variant={template.isPro && subscription?.tier === "free" ? "outline" : "default"}
            >
              {template.isPro && subscription?.tier === "free" ? "Upgrade to Use" : "Use Template"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};