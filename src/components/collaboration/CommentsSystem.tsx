import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MessageSquare,
    Reply,
    Heart,
    MoreVertical,
    Pin,
    Trash2,
    Edit
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Comment {
    id: string;
    user: string;
    avatar: string;
    content: string;
    timestamp: string;
    likes: number;
    isLiked: boolean;
    isPinned: boolean;
    replies?: Comment[];
}

interface CommentsSystemProps {
    entityId: string;
    entityType: 'dataset' | 'experiment' | 'report';
    entityName?: string;
}

export const CommentsSystem: React.FC<CommentsSystemProps> = ({
    entityId,
    entityType,
    entityName
}) => {
    const [comments, setComments] = useState<Comment[]>([
        {
            id: '1',
            user: 'Dr. Sarah Chen',
            avatar: '/placeholder.svg',
            content: 'The data quality looks excellent! I particularly like the preprocessing steps applied.',
            timestamp: '2 hours ago',
            likes: 5,
            isLiked: false,
            isPinned: true,
            replies: [
                {
                    id: '1-1',
                    user: 'John Smith',
                    avatar: '/placeholder.svg',
                    content: 'Agreed! The normalization technique used here is spot-on.',
                    timestamp: '1 hour ago',
                    likes: 2,
                    isLiked: true,
                    isPinned: false
                }
            ]
        },
        {
            id: '2',
            user: 'Emma Wilson',
            avatar: '/placeholder.svg',
            content: 'Should we consider adding more validation samples? Current sample size might be limiting.',
            timestamp: '5 hours ago',
            likes: 3,
            isLiked: false,
            isPinned: false
        }
    ]);

    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const handleAddComment = () => {
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            user: 'You',
            avatar: '/placeholder.svg',
            content: newComment,
            timestamp: 'Just now',
            likes: 0,
            isLiked: false,
            isPinned: false
        };

        setComments([comment, ...comments]);
        setNewComment('');
        toast.success('Comment added successfully');
    };

    const handleAddReply = (parentId: string) => {
        if (!replyContent.trim()) return;

        const reply: Comment = {
            id: `${parentId}-${Date.now()}`,
            user: 'You',
            avatar: '/placeholder.svg',
            content: replyContent,
            timestamp: 'Just now',
            likes: 0,
            isLiked: false,
            isPinned: false
        };

        setComments(comments.map(comment => {
            if (comment.id === parentId) {
                return {
                    ...comment,
                    replies: [...(comment.replies || []), reply]
                };
            }
            return comment;
        }));

        setReplyContent('');
        setReplyingTo(null);
        toast.success('Reply added successfully');
    };

    const handleLikeComment = (commentId: string) => {
        setComments(comments.map(comment => {
            if (comment.id === commentId) {
                return {
                    ...comment,
                    likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                    isLiked: !comment.isLiked
                };
            }
            // Also handle nested replies
            if (comment.replies) {
                return {
                    ...comment,
                    replies: comment.replies.map(reply => {
                        if (reply.id === commentId) {
                            return {
                                ...reply,
                                likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                                isLiked: !reply.isLiked
                            };
                        }
                        return reply;
                    })
                };
            }
            return comment;
        }));
    };

    const handlePinComment = (commentId: string) => {
        setComments(comments.map(comment => {
            if (comment.id === commentId) {
                toast.success(comment.isPinned ? 'Comment unpinned' : 'Comment pinned');
                return { ...comment, isPinned: !comment.isPinned };
            }
            return comment;
        }));
    };

    const handleDeleteComment = (commentId: string) => {
        setComments(comments.filter(comment => comment.id !== commentId));
        toast.success('Comment deleted');
    };

    const renderComment = (comment: Comment, isReply: boolean = false) => (
        <div
            key={comment.id}
            className={`group ${isReply ? 'ml-12 mt-3' : 'mb-4'} animate-in fade-in-50 slide-in-from-top-2`}
        >
            <div className="flex items-start gap-3">
                <Avatar className={isReply ? 'w-8 h-8' : 'w-10 h-10'}>
                    <AvatarImage src={comment.avatar} alt={comment.user} />
                    <AvatarFallback>{comment.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.user}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        {comment.isPinned && (
                            <Badge variant="secondary" className="gap-1">
                                <Pin className="w-3 h-3" />
                                Pinned
                            </Badge>
                        )}
                    </div>

                    <p className="text-sm mb-2 leading-relaxed">{comment.content}</p>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => handleLikeComment(comment.id)}
                        >
                            <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            <span className="text-xs">{comment.likes}</span>
                        </Button>

                        {!isReply && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1.5"
                                onClick={() => setReplyingTo(comment.id)}
                            >
                                <Reply className="w-3.5 h-3.5" />
                                <span className="text-xs">Reply</span>
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePinComment(comment.id)}>
                                    <Pin className="w-4 h-4 mr-2" />
                                    {comment.isPinned ? 'Unpin' : 'Pin'} Comment
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteComment(comment.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                        <div className="mt-3 animate-in fade-in-50 slide-in-from-top-2">
                            <Textarea
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="mb-2 min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAddReply(comment.id)}>
                                    Reply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {comment.replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Sort comments: pinned first, then by timestamp
    const sortedComments = [...comments].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <CardTitle>Comments</CardTitle>
                        <Badge variant="secondary">{comments.length}</Badge>
                    </div>
                    {entityName && (
                        <span className="text-sm text-muted-foreground">
                            On {entityType}: <span className="font-medium">{entityName}</span>
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* New Comment Input */}
                <div className="mb-6">
                    <Textarea
                        placeholder="Share your thoughts or ask a question..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-3 min-h-[100px]"
                    />
                    <Button onClick={handleAddComment} className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Add Comment
                    </Button>
                </div>

                {/* Comments List */}
                <ScrollArea className="h-[500px] pr-4">
                    {sortedComments.length > 0 ? (
                        <div>
                            {sortedComments.map(comment => renderComment(comment))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
