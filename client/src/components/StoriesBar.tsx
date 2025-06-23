import React, { useState, useEffect } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getStories } from '@/lib/storage';
import { Media } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Heart, Gift, Plane, Camera, Play } from 'lucide-react';

interface StoriesBarProps {
  stories?: Media[];
  onAddStory: () => void;
  onViewStory: (story: Media) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ stories: propStories, onAddStory, onViewStory }) => {
  const { gallery } = useGallery();
  const { user } = useAuth();
  const [localStories, setLocalStories] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.email === gallery?.ownerEmail;

  // Use prop stories if provided, otherwise load locally
  const stories = propStories || localStories;

  useEffect(() => {
    if (!gallery || propStories) {
      setLoading(false);
      return;
    }

    const loadStories = async () => {
      try {
        const storiesData = await getStories(gallery.id);
        setLocalStories(storiesData);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
    
    // Refresh stories every 30 seconds only if not using prop stories
    const interval = setInterval(loadStories, 30000);
    return () => clearInterval(interval);
  }, [gallery, propStories]);

  const getThemeGradient = () => {
    switch (gallery?.theme) {
      case 'wedding':
        return 'bg-gradient-to-r from-pink-500 to-purple-600';
      case 'birthday':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'vacation':
        return 'bg-gradient-to-r from-blue-400 to-teal-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-700';
    }
  };

  const getThemeIcon = () => {
    switch (gallery?.theme) {
      case 'wedding':
        return Heart;
      case 'birthday':
        return Gift;
      case 'vacation':
        return Plane;
      default:
        return Camera;
    }
  };

  const ThemeIcon = getThemeIcon();

  if (loading || !gallery) {
    return (
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                <div className="w-12 h-3 bg-gray-300 rounded mt-2 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group stories by visitor
  const groupedStories = stories.reduce((acc, story) => {
    const visitorId = story.visitorId;
    if (!acc[visitorId]) {
      acc[visitorId] = [];
    }
    acc[visitorId].push(story);
    return acc;
  }, {} as Record<string, Media[]>);

  // Get unique users with their latest story
  const userStories = Object.entries(groupedStories).map(([visitorId, userStoriesArray]) => ({
    visitorId,
    stories: userStoriesArray,
    latestStory: userStoriesArray[userStoriesArray.length - 1],
  }));

  // Sort: owner first, then by latest story time
  userStories.sort((a, b) => {
    if (a.visitorId === 'owner') return -1;
    if (b.visitorId === 'owner') return 1;
    return new Date(b.latestStory.createdAt).getTime() - new Date(a.latestStory.createdAt).getTime();
  });

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* Add Story Button */}
          <div className="flex-shrink-0 text-center">
            <button
              onClick={onAddStory}
              className="relative group"
            >
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center group-hover:border-gray-400 transition-colors">
                <Plus className="w-6 h-6 text-gray-500 group-hover:text-gray-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </button>
            <p className="text-xs text-gray-600 mt-2 truncate w-16">Add Story</p>
          </div>

          {/* User Stories */}
          {userStories.map((userStory) => {
            const isOwnerStory = userStory.visitorId === 'owner';
            const displayName = isOwnerStory ? 'Your Story' : userStory.visitorId;
            const initials = userStory.visitorId.charAt(0).toUpperCase();
            
            return (
              <div key={userStory.visitorId} className="flex-shrink-0 text-center">
                <button
                  onClick={() => onViewStory(userStory.latestStory)}
                  className="relative group"
                >
                  <div className={`w-16 h-16 ${getThemeGradient()} rounded-full p-0.5`}>
                    <div className="w-full h-full bg-white rounded-full overflow-hidden">
                      {/* Use story thumbnail as background */}
                      <img
                        src={userStory.latestStory.url}
                        alt={`${userStory.visitorId}'s story`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to theme icon or avatar
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center ${getThemeGradient()}">
                              ${isOwnerStory && gallery?.profileImage 
                                ? `<img src="${gallery.profileImage}" class="w-14 h-14 rounded-full object-cover" alt="${gallery.name}" />`
                                : `<div class="w-14 h-14 ${getThemeGradient()} rounded-full flex items-center justify-center text-white font-bold">${initials}</div>`
                              }
                            </div>`;
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Story count indicator */}
                  {userStory.stories.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-gray-900 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                      {userStory.stories.length}
                    </div>
                  )}

                  {/* Video indicator */}
                  {userStory.latestStory.type === 'video' && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                      <Play className="w-2 h-2 text-white fill-white" />
                    </div>
                  )}
                </button>
                
                <p className="text-xs text-gray-600 mt-2 truncate w-16">
                  {isOwnerStory ? 'Your Story' : (userStory.visitorId.length > 8 ? `${userStory.visitorId.slice(0, 8)}...` : userStory.visitorId)}
                </p>
                <p className="text-xs text-gray-400">
                  {userStory.stories.length} {userStory.stories.length === 1 ? 'story' : 'stories'}
                </p>
              </div>
            );
          })}

          {/* Empty State */}
          {userStories.length === 0 && (
            <div className="flex-1 text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No stories yet</p>
              <p className="text-gray-400 text-xs">Share the first moment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};