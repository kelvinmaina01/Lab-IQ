import { ExperimentTemplates } from "@/components/experiments/ExperimentTemplates";

// We need to extract the templates data to a shared location or duplicate it here for now.
// For simplicity and to avoid circular dependencies if we try to extract from the component, 
// I'll define the matching rules here.

interface TemplateRule {
    id: string;
    keywords: string[]; // Keywords to look for in filename
    columns: string[];  // Keywords to look for in column headers
}

const templateRules: TemplateRule[] = [
    {
        id: "chem-synthesis",
        keywords: ["synthesis", "compound", "reaction", "chem"],
        columns: ["reagent", "yield", "moles", "mass", "product"]
    },
    {
        id: "chem-titration",
        keywords: ["titration", "acid", "base", "ph", "buffer"],
        columns: ["volume", "concentration", "molarity", "ph", "titer"]
    },
    {
        id: "bio-microscopy",
        keywords: ["microscopy", "cell", "tissue", "slide", "magnification"],
        columns: ["magnification", "structure", "organelle", "stain"]
    },
    {
        id: "bio-enzyme",
        keywords: ["enzyme", "kinetics", "rate", "substrate", "catalyst"],
        columns: ["absorbance", "rate", "concentration", "time", "velocity"]
    },
    {
        id: "bio-dna",
        keywords: ["dna", "pcr", "gel", "electrophoresis", "genetic"],
        columns: ["bp", "band", "intensity", "lane", "marker"]
    },
    {
        id: "phys-mechanics",
        keywords: ["mechanics", "motion", "force", "velocity", "acceleration"],
        columns: ["time", "distance", "velocity", "acceleration", "force", "mass"]
    },
    {
        id: "phys-optics",
        keywords: ["optics", "light", "lens", "refraction", "laser"],
        columns: ["angle", "distance", "focal", "intensity", "wavelength"]
    },
    {
        id: "phys-circuits",
        keywords: ["circuit", "voltage", "current", "resistance", "ohm"],
        columns: ["voltage", "current", "resistance", "power", "amps", "volts"]
    }
];

export const suggestTemplates = (fileName: string, columns: string[]): string[] => {
    const normalizedFileName = fileName.toLowerCase();
    const normalizedColumns = columns.map(c => c.toLowerCase());

    const scores = templateRules.map(rule => {
        let score = 0;

        // Check filename keywords (high weight)
        rule.keywords.forEach(keyword => {
            if (normalizedFileName.includes(keyword)) score += 5;
        });

        // Check column headers (medium weight)
        rule.columns.forEach(colKeyword => {
            if (normalizedColumns.some(c => c.includes(colKeyword))) score += 2;
        });

        return { id: rule.id, score };
    });

    // Return templates with a score > 0, sorted by score descending
    return scores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(s => s.id);
};
