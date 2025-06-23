import React, { useEffect, useState } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { Media, Comment, Like, Visitor } from '@shared/schema';
import { 
  subscribeToGalleryMedia, 
  toggleLike, 
  getLikes, 
  getComments, 
  createComment,
  deleteMedia,
  deleteComment,
  getVisitor
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MediaWithDetails extends Media {
  authorName?: string;
  likes: Like[];
  comments: Comment[];
  isLiked: boolean;
}

export const GalleryFeed: React.FC = () => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const [media, setMedia] = useState<MediaWithDetails[]>([]);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gallery || !visitor) return;

    const unsubscribe = subscribeToGalleryMedia(gallery.id, async (mediaData) => {
      try {
        // Filter out expired stories and add details
        const activeMedia = mediaData.filter(item => {
          if (item.type === 'story' && item.expiresAt) {
            return item.expiresAt > new Date();
          }
          return item.type !== 'story'; // Include photos and videos
        });

        const mediaWithDetails = await Promise.all(
          activeMedia.map(async (item) => {
            const [likes, comments, author] = await Promise.all([
              getLikes(gallery.id, item.id),
              getComments(gallery.id, item.id),
              getVisitor(gallery.id, item.visitorId)
            ]);

            const isLiked = likes.some(like => like.visitorId === visitor.id);

            return {
              ...item,
              authorName: author?.name || 'Unknown',
              likes,
              comments,
              isLiked,
            };
          })
        );

        setMedia(mediaWithDetails);
      } catch (error) {
        console.error('Error processing media:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [gallery, visitor]);

  const handleLike = async (mediaId: string) => {
    if (!gallery || !visitor) return;

    try {
      const newLikedState = await toggleLike(gallery.id, mediaId, visitor.id);
      
      setMedia(prev => prev.map(item => {
        if (item.id === mediaId) {
          return {
            ...item,
            isLiked: newLikedState,
            likes: newLikedState 
              ? [...item.likes, { id: Date.now().toString(), mediaId, galleryId: gallery.id, visitorId: visitor.id, createdAt: new Date() }]
              : item.likes.filter(like => like.visitorId !== visitor.id)
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (mediaId: string) => {
    if (!gallery || !visitor) return;

    const commentText = commentTexts[mediaId]?.trim();
    if (!commentText) return;

    try {
      await createComment({
        mediaId,
        galleryId: gallery.id,
        visitorId: visitor.id,
        text: commentText,
      });

      setCommentTexts(prev => ({ ...prev, [mediaId]: '' }));
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleDeleteMedia = async (mediaItem: MediaWithDetails) => {
    if (!gallery || !visitor || mediaItem.visitorId !== visitor.id) return;

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteMedia(gallery.id, mediaItem.id, mediaItem.url);
      } catch (error) {
        console.error('Error deleting media:', error);
      }
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!gallery || !visitor || comment.visitorId !== visitor.id) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(gallery.id, comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/6"></div>
              </div>
            </div>
            <div className="h-96 bg-gray-300"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Heart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No memories yet</h3>
        <p className="text-gray-500">Be the first to share a special moment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {media.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  {item.authorName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-800">{item.authorName}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {visitor && item.visitorId === visitor.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteMedia(item)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="relative">
            {item.type === 'video' ? (
              <div className="relative">
                <video
                  src={item.url}
                  className="w-full h-96 object-cover"
                  controls
                  poster={item.thumbnailUrl}
                />
              </div>
            ) : (
              <img
                src={item.url}
                alt="Gallery content"
                className="w-full h-96 object-cover"
              />
            )}
          </div>

          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(item.id)}
                  className="p-0 h-auto"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      item.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    } transition-colors`}
                  />
                </Button>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                </Button>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <Share2 className="w-6 h-6 text-gray-600" />
                </Button>
              </div>
            </div>

            <p className="font-medium text-gray-800 mb-2">
              {item.likes.length} {item.likes.length === 1 ? 'like' : 'likes'}
            </p>

            {item.caption && (
              <p className="text-gray-800 mb-3">
                <span className="font-medium">{item.authorName}</span>{' '}
                {item.caption}
              </p>
            )}

            {item.comments.length > 0 && (
              <div className="space-y-2 mb-3">
                {item.comments.slice(-2).map((comment) => (
                  <div key={comment.id} className="flex items-start justify-between">
                    <p className="text-sm text-gray-800 flex-1">
                      <span className="font-medium">{comment.visitorId}</span>{' '}
                      {comment.text}
                    </p>
                    {visitor && comment.visitorId === visitor.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment)}
                        className="text-red-500 hover:text-red-700 p-1 h-auto ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {item.comments.length > 2 && (
                  <button className="text-sm text-gray-500">
                    View all {item.comments.length} comments
                  </button>
                )}
              </div>
            )}

            <div className="border-t pt-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-blue-400 to-teal-500 text-white text-sm">
                    {visitor?.name.charAt(0).toUpperCase() || 'Y'}
                  </AvatarFallback>
                </Avatar>
                <Input
                  placeholder="Add a comment..."
                  value={commentTexts[item.id] || ''}
                  onChange={(e) =>
                    setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))
                  }
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleComment(item.id);
                    }
                  }}
                  className="flex-1 border-none focus:ring-0 px-0"
                />
                <Button
                  onClick={() => handleComment(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-pink-500 font-medium"
                  disabled={!commentTexts[item.id]?.trim()}
                >
                  Post
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
