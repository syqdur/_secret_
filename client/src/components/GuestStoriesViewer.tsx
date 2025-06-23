import React, { useState, useEffect, useCallback } from 'react';
import { useVisitor } from '@/contexts/VisitorContext';
import { deleteMedia } from '@/lib/api-storage';
import { Media } from '@shared/schema';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StoryGroup {
  authorId: string;
  stories: Media[];
  latestStory: Media;
}

interface GuestStoriesViewerProps {
  isOpen: boolean;
  onClose: () => void;
  authorGroups: StoryGroup[];
  initialGroupIndex: number;
}

export const GuestStoriesViewer: React.FC<GuestStoriesViewerProps> = ({
  isOpen,
  onClose,
  authorGroups,
  initialGroupIndex
}) => {
  const { visitor } = useVisitor();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentGroup = authorGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = visitor && currentStory?.authorId === visitor.id;

  const STORY_DURATION = 5000; // 5 seconds per story

  const nextStory = useCallback(() => {
    if (!currentGroup) return;

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < authorGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroup, currentStoryIndex, currentGroupIndex, authorGroups.length, onClose]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      const prevGroup = authorGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentGroupIndex, authorGroups]);

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / 100));
        if (newProgress >= 100) {
          nextStory();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, nextStory]);

  useEffect(() => {
    if (isOpen) {
      setCurrentGroupIndex(initialGroupIndex);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, [isOpen, initialGroupIndex]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        prevStory();
        break;
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextStory();
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [isOpen, prevStory, nextStory, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleDeleteStory = async () => {
    if (!currentStory || !visitor || currentStory.authorId !== visitor.id) return;

    try {
      await deleteMedia(currentStory.id, visitor.id);
      
      // If this was the last story in the group, move to next group or close
      if (currentGroup.stories.length === 1) {
        if (currentGroupIndex < authorGroups.length - 1) {
          setCurrentGroupIndex(prev => prev + 1);
          setCurrentStoryIndex(0);
        } else {
          onClose();
        }
      } else {
        // Move to next story in the same group
        if (currentStoryIndex >= currentGroup.stories.length - 1) {
          setCurrentStoryIndex(0);
        }
      }
      setProgress(0);
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 bg-black border-none">
        <div className="relative h-screen max-h-[600px] bg-black">
          {/* Progress Bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex space-x-1">
            {currentGroup.stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                {currentStory.authorId?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isOwnStory ? 'Your Story' : `Guest ${currentStory.authorId.slice(-4)}`}
                </p>
                <p className="text-xs text-white/80">
                  {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isOwnStory && (
                <Button
                  onClick={handleDeleteStory}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 w-8 h-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div 
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}
          >
            {currentStory.type === 'video' ? (
              <video
                src={currentStory.url}
                className="max-w-full max-h-full object-contain"
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                src={currentStory.url}
                alt={currentStory.caption || 'Story'}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Navigation Overlays */}
          <div className="absolute inset-0 flex">
            <button
              onClick={prevStory}
              className="flex-1 bg-transparent"
              disabled={currentGroupIndex === 0 && currentStoryIndex === 0}
            />
            <button
              onClick={nextStory}
              className="flex-1 bg-transparent"
            />
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <p className="text-white text-sm bg-black/50 rounded-lg px-3 py-2">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Paused Indicator */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="bg-black/50 rounded-full p-4">
                <div className="text-white text-2xl">⏸️</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};