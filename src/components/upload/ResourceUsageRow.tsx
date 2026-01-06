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
        <div className="flex items-center gap-10 px-6 py-4 bg-gradient-to-r from-slate-50/50 to-transparent border-b border-slate-100">
            {/* Storage - Red */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <HardDrive className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Storage</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-slate-900">{Math.round(usage?.storage_used_mb || 0)}</span>
                        <span className="text-[10px] font-semibold text-slate-400">/ {subscription?.storage_limit_mb === -1 ? '∞' : subscription?.storage_limit_mb} MB</span>
                    </div>
                </div>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* Datasets - Green */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Datasets</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-slate-900">{usage?.datasets_count || 0}</span>
                        <span className="text-[10px] font-semibold text-slate-400">/ {subscription?.max_datasets === -1 ? '∞' : subscription?.max_datasets}</span>
                    </div>
                </div>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* Plan - Blue */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Plan</span>
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">{subscription?.tier || 'Free'}</span>
                </div>
            </div>
        </div>
    );
};
