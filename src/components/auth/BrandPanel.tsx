import { motion } from "framer-motion";
import { Brain, Zap, Users, BarChart3 } from "lucide-react";

export const BrandPanel = () => {
    return (
        <div className="relative hidden w-0 flex-1 lg:flex flex-col justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 border-l border-slate-100 p-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-white/40 to-white pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-md mx-auto space-y-12 relative z-10">
                <div className="space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold text-slate-900 leading-tight"
                    >
                        Transform your data with <br />
                        <span className="text-primary">AI-powered intelligence</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-muted-foreground leading-relaxed"
                    >
                        Stop coding pipelines. Start discovering insights. DataIQ automates your data journey from raw upload to explainable scientific discovery.
                    </motion.p>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            title: "Intelligent Analysis",
                            desc: "Connect with AutoML agents to get instant pattern detection",
                            icon: Brain,
                            color: "bg-primary/10 text-primary border-primary/20"
                        },
                        {
                            title: "Automated Pipelines",
                            desc: "Zero-code data cleaning and processing workflows",
                            icon: Zap,
                            color: "bg-secondary/10 text-secondary border-secondary/20"
                        },
                        {
                            title: "Real-time Collaboration",
                            desc: "Share dashboards and insights with your team instantly",
                            icon: Users,
                            color: "bg-primary/10 text-primary border-primary/20"
                        }
                    ].map((item, idx) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.1) }}
                            className="bg-white/60 p-5 rounded-2xl shadow-sm border border-slate-200/50 flex gap-4 hover:bg-white/80 transition-colors duration-300"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
