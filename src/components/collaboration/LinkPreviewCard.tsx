
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useServices } from '@/core/ServiceProvider';
import { Link } from 'react-router-dom';

interface LinkPreviewCardProps {
    url: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url }) => {
    const { collaboration } = useServices();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [type, setType] = useState<'experiment' | 'project' | null>(null);

    useEffect(() => {
        const fetchMetadata = async () => {
            setLoading(true);
            setError(false);

            // Simple parsing logic
            // Expected formats: /experiments/:id or /projects/:id
            // We strip origin if present
            const path = url.replace(/^(?:\/\/|[^/]+)*\//, '/');

            try {
                if (path.includes('/experiments/')) {
                    const id = path.split('/experiments/')[1]?.split('/')[0];
                    if (id) {
                        const { data } = await collaboration.getExperiment(id);
                        if (data) {
                            setData(data);
                            setType('experiment');
                        } else {
                            setError(true);
                        }
                    }
                } else if (path.includes('/projects/')) {
                    const id = path.split('/projects/')[1]?.split('/')[0];
                    if (id) {
                        const { data } = await collaboration.getProject(id);
                        if (data) {
                            setData(data);
                            setType('project');
                        } else {
                            setError(true);
                        }
                    }
                } else {
                    setError(true); // Not a recognized link
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [url, collaboration]);

    if (error || !type) return null; // Don't render broken previews

    if (loading) {
        return (
            <Card className="mt-2 max-w-sm bg-muted/30 animate-pulse">
                <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 bg-muted rounded"></div>
                            <div className="h-2 w-1/3 bg-muted rounded"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-2 max-w-sm border-l-4 border-l-primary overflow-hidden hover:bg-muted/10 transition-colors">
            <Link to={url} className="block">
                <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md ${type === 'experiment' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {type === 'experiment' ? <FlaskConical className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{data.title || data.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                    {data.status || 'Active'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {type === 'experiment' ? 'Experiment' : 'Project'}
                                </span>
                            </div>
                            {data.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {data.description}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};
