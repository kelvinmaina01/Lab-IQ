import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Database,
    FileText,
    TestTube,
    Search,
    Share2,
    Filter,
    CheckCircle2,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { useServices } from '@/core/ServiceProvider';
import { toast } from 'sonner';

interface ResourceShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    channelId: string;
    labId: string;
}

type ResourceType = 'dataset' | 'report' | 'experiment';

export const ResourceShareModal: React.FC<ResourceShareModalProps> = ({
    isOpen,
    onClose,
    channelId,
    labId
}) => {
    const { collaboration } = useServices();
    const [activeTab, setActiveTab] = useState<ResourceType>('dataset');
    const [searchQuery, setSearchQuery] = useState('');
    const [resources, setResources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadResources();
        }
    }, [isOpen, activeTab]);

    const loadResources = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await collaboration.getLabResources(labId, activeTab);
            if (error) throw error;
            setResources(data || []);
        } catch (error: any) {
            toast.error(`Failed to load ${activeTab}s`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (!selectedId) return;

        const selectedResource = resources.find(r => r.id === selectedId);
        if (!selectedResource) return;

        try {
            const { error } = await collaboration.shareResource(
                selectedId,
                activeTab,
                channelId
            );
            if (error) throw error;

            toast.success(`${activeTab} shared successfully`);
            onClose();
        } catch (error) {
            toast.error('Failed to share resource');
            console.error(error);
        }
    };

    const filteredResources = resources.filter(r =>
        (r.name || r.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0f172a] border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-indigo-400" />
                                Share Scientific Resource
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Link core lab data to this collaboration</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search & Tabs */}
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}s...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>

                        <div className="flex p-1 bg-slate-800/50 rounded-xl gap-1">
                            {[
                                { id: 'dataset', label: 'Datasets', icon: Database },
                                { id: 'report', label: 'Reports', icon: FileText },
                                { id: 'experiment', label: 'Experiments', icon: TestTube },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as ResourceType)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-[300px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                <p className="text-slate-500 animate-pulse">Fetching lab data...</p>
                            </div>
                        ) : filteredResources.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredResources.map((resource) => (
                                    <motion.div
                                        key={resource.id}
                                        layoutId={resource.id}
                                        onClick={() => setSelectedId(resource.id)}
                                        className={`group relative p-4 rounded-xl border cursor-pointer transition-all ${selectedId === resource.id
                                            ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/5'
                                            : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className={`p-2.5 rounded-lg ${selectedId === resource.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400'
                                                    }`}>
                                                    {activeTab === 'dataset' && <Database className="w-5 h-5" />}
                                                    {activeTab === 'report' && <FileText className="w-5 h-5" />}
                                                    {activeTab === 'experiment' && <TestTube className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{resource.name || resource.title}</h3>
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                                        {resource.description || `No description available for this ${activeTab}.`}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                                                            ID: {resource.id.substring(0, 8)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            Modified {new Date(resource.updated_at || resource.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedId === resource.id && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="bg-indigo-500 text-white rounded-full p-1 shadow-lg shadow-indigo-500/50"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                                <Filter className="w-12 h-12 text-slate-700 mb-4" />
                                <p className="text-slate-400">No {activeTab}s found matching your search</p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                >
                                    Clear search filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <ExternalLink className="w-4 h-4" />
                            <span>Visible to all channel members</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShare}
                                disabled={!selectedId}
                                className={`px-8 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl ${selectedId
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:scale-105 active:scale-95 shadow-indigo-500/20'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    }`}
                            >
                                Share with Channel
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
