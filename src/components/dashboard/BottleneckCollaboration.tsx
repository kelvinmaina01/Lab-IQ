import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertCircle } from "lucide-react";
import { CollaborationPanel } from "@/components/dashboard/CollaborationPanel";

interface BottleneckCollaborationProps {
  bottleneckId: string;
  title: string;
  description: string;
  impactScore: number;
}

export const BottleneckCollaboration = ({ 
  bottleneckId, 
  title, 
  description, 
  impactScore 
}: BottleneckCollaborationProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold">{title}</h4>
            </div>
            <Badge variant="outline" className="text-orange-500">
              -{impactScore}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            View Comments
          </Button>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{description}</p>
          </div>
          <CollaborationPanel bottleneckId={bottleneckId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};