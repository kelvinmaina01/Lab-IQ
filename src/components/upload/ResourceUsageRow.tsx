import { Card } from "@/components/ui/card";
import { HardDrive, LayoutGrid, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const ResourceUsageRow = () => {
    const { subscription, usage, loading } = useSubscription();

    if (loading) {
        return (
            <Card className="flex items-center gap-8 px-8 py-6 bg-white/50 backdrop-blur-sm border-slate-100 shadow-sm rounded-2xl animate-pulse">
                <div className="h-10 w-40 bg-slate-100 rounded-lg" />
                <div className="h-8 w-px bg-slate-100" />
                <div className="h-10 w-40 bg-slate-100 rounded-lg" />
                <div className="h-8 w-px bg-slate-100" />
                <div className="h-10 w-40 bg-slate-100 rounded-lg" />
            </Card>
        );
    }

    return (
        <div className="flex items-center gap-6 px-4 py-2.5 bg-background/40 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            {/* Storage - Red */}
            <div className="flex items-center gap-2.5 group">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <HardDrive className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0">Storage</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[11px] font-black text-slate-900 leading-none">{Math.round(usage?.storage_used_mb || 0)}</span>
                        <span className="text-[9px] font-bold text-slate-400 opacity-60">/ {subscription?.storage_limit_mb === -1 ? '∞' : subscription?.storage_limit_mb} MB</span>
                    </div>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-200/60" />

            {/* Datasets - Green */}
            <div className="flex items-center gap-2.5 group">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0">Datasets</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[11px] font-black text-slate-900 leading-none">{usage?.datasets_count || 0}</span>
                        <span className="text-[9px] font-bold text-slate-400 opacity-60">/ {subscription?.max_datasets === -1 ? '∞' : subscription?.max_datasets}</span>
                    </div>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-200/60" />

            {/* Plan - Blue */}
            <div className="flex items-center gap-2.5 group">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0">Plan</span>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{subscription?.tier || 'Free'}</span>
                </div>
            </div>
        </div>
    );
};
