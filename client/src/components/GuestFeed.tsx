import React, { useState } from 'react';
import { t } from '@/lib/translations';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { 
  getMedia, 
  getComments, 
  createComment, 
  deleteComment,
  toggleLike,
  deleteMedia 
} from '@/lib/api-storage';
import { Media, Comment } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Trash2, Play, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MediaWithDetails extends Media {
  authorName?: string;
  likes: any[];
  comments: Comment[];
  isLiked: boolean;
}

export const GuestFeed: React.FC = () => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const queryClient = useQueryClient();
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['media', gallery?.id],
    queryFn: async () => {
      if (!gallery) return [];
      
      const mediaData = await getMedia(gallery.id);
      // Filter out stories - only show regular posts
      const posts = mediaData.filter(item => item.type !== 'story');
      
      // Enhance with additional data
      const enhancedMedia: MediaWithDetails[] = await Promise.all(
        posts.map(async (item) => {
          try {
            const [comments] = await Promise.all([
              getComments(item.id),
            ]);
            
            return {
              ...item,
              authorName: `Guest ${item.authorId.slice(-4)}`,
              likes: [], // We'll handle likes separately for performance
              comments,
              isLiked: false, // We'll check this separately
            };
          } catch (error) {
            console.error('Error loading media details:', error);
            return {
              ...item,
              authorName: `Guest ${item.authorId.slice(-4)}`,
              likes: [],
              comments: [],
              isLiked: false,
            };
          }
        })
      );
      
      return enhancedMedia.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!gallery,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const commentMutation = useMutation({
    mutationFn: async ({ mediaId, content }: { mediaId: string; content: string }) => {
      if (!visitor) throw new Error('Visitor not found');
      return createComment({
        mediaId,
        authorId: visitor.id,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', gallery?.id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!visitor) throw new Error('Visitor not found');
      return deleteComment(commentId, visitor.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', gallery?.id] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      if (!visitor || !gallery) throw new Error('Visitor or gallery not found');
      return toggleLike(gallery.id, mediaId, visitor.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', gallery?.id] });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      if (!visitor) throw new Error('Visitor not found');
      return deleteMedia(mediaId, visitor.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', gallery?.id] });
    },
  });

  const handleComment = async (mediaId: string) => {
    const content = commentTexts[mediaId]?.trim();
    if (!content) return;

    try {
      await commentMutation.mutateAsync({ mediaId, content });
      setCommentTexts(prev => ({ ...prev, [mediaId]: '' }));
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!visitor || comment.authorId !== visitor.id) return;
    
    try {
      await deleteCommentMutation.mutateAsync(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLike = async (mediaId: string) => {
    try {
      await likeMutation.mutateAsync(mediaId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDeleteMedia = async (mediaItem: MediaWithDetails) => {
    if (!visitor || mediaItem.authorId !== visitor.id) return;
    
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteMediaMutation.mutateAsync(mediaItem.id);
      } catch (error) {
        console.error('Error deleting media:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                </div>
              </div>
              <div className="h-64 bg-gray-300 rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">{t('noMediaYet')}</h3>
        <p className="text-gray-600">{t('beFirstToUpload')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {media.map((item) => {
        const isOwnPost = visitor && item.authorId === visitor.id;
        const commentsVisible = showComments[item.id] || false;
        
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      {item.authorId?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {isOwnPost ? 'You' : `Guest ${item.authorId.slice(-4)}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {isOwnPost && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteMedia(item)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Media Content */}
              <div className="relative">
                {item.type === 'video' ? (
                  <div className="relative bg-black">
                    <video
                      src={item.url}
                      controls
                      className="w-full max-h-96 object-contain"
                      poster={item.thumbnailUrl}
                    >
                      Your browser does not support video playback.
                    </video>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/50 rounded-full p-3">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || 'Post'}
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex items-center space-x-4 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(item.id)}
                    className={`p-2 ${item.isLiked ? 'text-red-500' : 'text-gray-600'}`}
                  >
                    <Heart className={`w-5 h-5 ${item.isLiked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className="p-2 text-gray-600"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>

                {/* Likes count */}
                {item.likes.length > 0 && (
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {item.likes.length} {t('likesCount')}
                  </p>
                )}

                {/* Caption */}
                {item.caption && (
                  <p className="text-gray-900 mb-3">
                    <span className="font-medium">
                      {isOwnPost ? 'You' : `Guest ${item.authorId.slice(-4)}`}
                    </span>{' '}
                    {item.caption}
                  </p>
                )}

                {/* Comments */}
                {item.comments.length > 0 && !commentsVisible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(prev => ({ ...prev, [item.id]: true }))}
                    className="text-gray-500 mb-3 p-0 h-auto"
                  >
                    {item.comments.length} {t('commentsCount')} anzeigen
                  </Button>
                )}

                {commentsVisible && (
                  <div className="space-y-2 mb-3">
                    {item.comments.map((comment) => {
                      const isOwnComment = visitor && comment.authorId === visitor.id;
                      return (
                        <div key={comment.id} className="flex items-start space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-gray-300 text-xs">
                              {comment.authorId?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">
                                {isOwnComment ? 'Sie' : `Gast ${comment.authorId.slice(-4)}`}
                              </span>{' '}
                              {comment.content}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {isOwnComment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment)}
                              className="w-6 h-6 p-0 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs">
                      {visitor?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex space-x-2">
                    <Input
                      placeholder={t('addComment')}
                      value={commentTexts[item.id] || ''}
                      onChange={(e) => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleComment(item.id)}
                      className="border-none bg-gray-50 focus:bg-white"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleComment(item.id)}
                      disabled={!commentTexts[item.id]?.trim() || commentMutation.isPending}
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};