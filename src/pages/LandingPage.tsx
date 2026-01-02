import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Zap, Database } from "lucide-react";
import { motion } from "framer-motion";

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        LabIQ Health
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-slate-300 hover:text-white">Sign In</Button>
                        </Link>
                        <Link to="/upload">
                            <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-full">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-32 pb-20 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium">
                        <Zap className="w-3 h-3" />
                        <span>V1.0 Now Live</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                        Turn Raw Health Data into <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500">
                            Scientific Discoveries
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        The world's first automated data intelligence platform for healthcare.
                        Upload CSVs, get insights. No coding required.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to="/upload">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-slate-900 hover:bg-slate-100">
                                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link to="/demo">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-24">
                    {[
                        {
                            icon: Database,
                            title: "Instant Ingestion",
                            desc: "Drag & drop CSV, Excel, or JSON. We handle the cleaning and schema detection."
                        },
                        {
                            icon: Zap,
                            title: "Automated ML",
                            desc: "Our AI agents train models on your data automatically to find hidden patterns."
                        },
                        {
                            icon: Activity,
                            title: "Explainable Insights",
                            desc: "Don't just get a prediction. Understand the 'Why' behind every health metric."
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                            className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-teal-500/30 transition-colors text-left"
                        >
                            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-4">
                                <feature.icon className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};
