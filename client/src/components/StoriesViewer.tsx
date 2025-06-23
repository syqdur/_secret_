import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2, Eye } from 'lucide-react';
import { Media } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';

interface StoriesViewerProps {
  isOpen: boolean;
  stories: Media[];
  initialStoryIndex: number;
  onClose: () => void;
  onDeleteStory?: (storyId: string) => void;
}

export const StoriesViewer: React.FC<StoriesViewerProps> = ({
  isOpen,
  stories,
  initialStoryIndex,
  onClose,
  onDeleteStory
}) => {
  const { user } = useAuth();
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds per story
  const isOwner = user?.email === gallery?.ownerEmail;

  // Check if current user can delete this story (owner OR the person who uploaded it)
  const canDeleteStory = isOwner || (currentStory && visitor && currentStory.authorId === visitor.id) || (currentStory && currentStory.authorId === 'owner');

  useEffect(() => {
    if (!isOpen || !currentStory) return;

    // Reset state when story changes
    setProgress(0);
    setIsLoading(true);

    // Preload media
    if (currentStory.type === 'photo' || currentStory.type === 'story') {
      const img = new Image();
      img.onload = () => setIsLoading(false);
      img.onerror = () => {
        console.error('Failed to load story image:', currentStory.url);
        setIsLoading(false);
      };
      img.src = currentStory.url;
    } else if (currentStory.type === 'video') {
      // For videos, set loading to false immediately
      setIsLoading(false);
    }
  }, [currentIndex, currentStory, isOpen]);

  useEffect(() => {
    if (!isOpen || isPaused || isLoading || !currentStory) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / 100));
        
        if (newProgress >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(prevIndex => prevIndex + 1);
          } else {
            onClose();
          }
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isLoading, currentIndex, stories.length, onClose, currentStory]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ': // Spacebar
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const goToNext = React.useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrevious = React.useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const togglePause = React.useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);



  const handleDeleteStory = () => {
    if (!currentStory || !canDeleteStory || !onDeleteStory) return;

    const storyType = currentStory.type === 'video' ? 'Video story' : 'Photo story';
    const isOwnStory = visitor && currentStory.authorId === visitor.id;
    const confirmMessage = isOwnStory 
      ? `Delete your ${storyType.toLowerCase()}?`
      : `Delete this ${storyType.toLowerCase()}?`;

    if (window.confirm(confirmMessage)) {
      onDeleteStory(currentStory.id);
      
      // Move to next story or close if this was the last one
      if (stories.length > 1) {
        if (currentIndex < stories.length - 1) {
          // Stay at current index, next story will shift into this position
        } else {
          // Go to previous story if this was the last one
          setCurrentIndex(prev => prev - 1);
        }
      } else {
        // Close viewer if this was the only story
        onClose();
      }
    }
  };

  const formatTimeAgo = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {currentStory.authorId === 'owner' ? 'O' : (currentStory.authorId || 'G').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm">
              {currentStory.authorId === 'owner' ? (gallery?.name || 'Gallery Owner') : currentStory.authorId || 'Guest'}
            </span>
            <div className="text-white/70 text-xs">
              {formatTimeAgo(currentStory.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDeleteStory && onDeleteStory && (
            <button
              onClick={handleDeleteStory}
              className="p-2 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors"
              title="Delete story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={togglePause}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center max-w-sm mx-auto">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* 9:16 aspect ratio container */}
        <div className="relative aspect-[9/16] w-full max-h-full bg-black rounded-lg overflow-hidden">
          {currentStory.type === 'video' ? (
            <video
              src={currentStory.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              style={{ opacity: isLoading ? 0 : 1 }}
            />
          ) : (
            <img
              src={currentStory.url}
              alt="Story"
              className="w-full h-full object-cover"
              style={{ opacity: isLoading ? 0 : 1 }}
              onLoad={() => console.log('Story image loaded:', currentStory.url)}
              onError={() => console.error('Story image failed to load:', currentStory.url)}
            />
          )}

          {/* Caption overlay */}
          {currentStory.caption && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
                <p className="text-sm">{currentStory.caption}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Areas */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity group"
          disabled={currentIndex === 0}
        >
          {currentIndex > 0 && (
            <div className="bg-black/50 rounded-full p-2 group-hover:bg-black/70 transition-colors">
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity group"
        >
          <div className="bg-black/50 rounded-full p-2 group-hover:bg-black/70 transition-colors">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Tap to pause/play (center area) */}
        <button
          onClick={togglePause}
          className="absolute inset-0 w-1/3 h-full left-1/3"
          style={{ background: 'transparent' }}
        />
      </div>

      {/* Story info */}
      <div className="absolute bottom-4 left-4 right-4 z-10 max-w-sm mx-auto">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between text-white text-sm">
            <span>
              {currentIndex + 1} of {stories.length}
            </span>
          </div>
          
          {/* Keyboard shortcuts hint */}
          <div className="text-white/60 text-xs mt-2 text-center">
            ← → Navigate • Space Pause • Esc Close
          </div>
        </div>
      </div>
    </div>
  );
};