import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    MessageCircle,
    Send,
    ThumbsUp,
    MoreHorizontal,
    Pin,
    Reply,
    Trash2,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useServices } from "@/core/ServiceProvider";
import { Comment } from "@/core/interfaces";
import { toast } from "sonner";

interface CommentsSystemProps {
    entityId: string;
    entityType: 'project' | 'experiment' | 'dataset' | 'file';
    entityName?: string;
}

export const CommentsSystem: React.FC<CommentsSystemProps> = ({
    entityId,
    entityType,
    entityName
}) => {
    const { collaboration } = useServices();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!entityId) return;
        fetchComments();
    }, [entityId, entityType]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const { data } = await collaboration.getComments(entityId, entityType);
            if (data) setComments(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const { data, error } = await collaboration.addComment(
                entityId,
                entityType,
                newComment,
                replyTo || undefined
            );

            if (error) throw error;

            if (data) {
                await fetchComments();
                setNewComment("");
                setReplyTo(null);
                toast.success("Comment posted");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId: string) => {
        try {
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked };
                }
                if (c.replies) {
                    return {
                        ...c,
                        replies: c.replies.map(r => r.id === commentId ? { ...r, likes: r.isLiked ? r.likes - 1 : r.likes + 1, isLiked: !r.isLiked } : r)
                    };
                }
                return c;
            }));

            await collaboration.toggleLikeComment(commentId);
        } catch (error) {
            console.error(error);
            toast.error("Failed to like comment");
            await fetchComments();
        }
    };

    const handlePin = async (commentId: string) => {
        try {
            const { error } = await collaboration.togglePinComment(commentId);
            if (error) throw error;

            setComments(prev => prev.map(c => {
                if (c.id === commentId) return { ...c, isPinned: !c.isPinned };
                return c;
            }));
            toast.success("Comment pin status updated");

        } catch (err) {
            console.error("Failed to pin", err);
            toast.error("Failed to update pin status");
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await collaboration.deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast.success("Comment deleted");
            await fetchComments();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete comment");
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
        <div className={`group flex gap-3 ${isReply ? "ml-12 mt-3" : "mb-6"}`}>
            <Avatar className={isReply ? "w-8 h-8" : "w-10 h-10"}>
                <AvatarImage src={comment.avatar} />
                <AvatarFallback>{comment.user[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.user}</span>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    {comment.isPinned && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                            <Pin className="w-3 h-3" /> Pinned
                        </Badge>
                    )}
                </div>
                <div className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap">
                    {comment.content}
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 text-xs gap-1.5 ${comment.isLiked ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => handleLike(comment.id)}
                    >
                        <ThumbsUp className={`w-3 h-3 ${comment.isLiked ? "fill-current" : ""}`} />
                        {comment.likes || "Like"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs gap-1.5 text-muted-foreground"
                        onClick={() => setReplyTo(comment.id)}
                    >
                        <Reply className="w-3 h-3" />
                        Reply
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePin(comment.id)}>
                                <Pin className="w-3 h-3 mr-2" />
                                {comment.isPinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(comment.id)}>
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {comment.replies && comment.replies.map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply />
                ))}
            </div>
        </div>
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="border-b py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Comments
                            <Badge variant="secondary">{comments.length}</Badge>
                        </CardTitle>
                        {entityName && (
                            <CardDescription className="mt-1">
                                {entityName}
                            </CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-6">
                {loading && comments.length === 0 ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        No comments yet. Be the first to start the discussion!
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))
                )}
            </ScrollArea>

            <div className="p-4 border-t bg-muted/10">
                {replyTo && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-1">
                        <span>Replying to comment...</span>
                        <Button variant="ghost" size="sm" className="h-auto p-0" onClick={() => setReplyTo(null)}>Cancel</Button>
                    </div>
                )}
                <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <Textarea
                            placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px] mb-2 resize-none bg-background"
                        />
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={handlePostComment}
                                disabled={!newComment.trim() || submitting}
                                className="gap-2"
                            >
                                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                Post Comment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
