import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { getStories } from '@/lib/api-storage';
import { Media } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { GuestStoriesViewer } from '@/components/GuestStoriesViewer';

interface GuestStoriesSectionProps {
  onAddStory: () => void;
}

export const GuestStoriesSection: React.FC<GuestStoriesSectionProps> = ({ onAddStory }) => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories', gallery?.id],
    queryFn: () => gallery ? getStories(gallery.id) : Promise.resolve([]),
    enabled: !!gallery,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  if (isLoading || !gallery) {
    return (
      <div className="flex space-x-3 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  // Group stories by author
  const storiesByAuthor = stories.reduce((acc, story) => {
    const authorId = story.authorId;
    if (!acc[authorId]) {
      acc[authorId] = [];
    }
    acc[authorId].push(story);
    return acc;
  }, {} as Record<string, Media[]>);

  const authorGroups = Object.entries(storiesByAuthor).map(([authorId, authorStories]) => ({
    authorId,
    stories: authorStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    latestStory: authorStories.reduce((latest, story) => 
      new Date(story.createdAt) > new Date(latest.createdAt) ? story : latest
    )
  })).sort((a, b) => 
    new Date(b.latestStory.createdAt).getTime() - new Date(a.latestStory.createdAt).getTime()
  );

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Stories</h2>
      <div className="flex space-x-3 overflow-x-auto pb-4">
        {/* Add Story Button */}
        <div className="flex-shrink-0 text-center">
          <Button
            onClick={onAddStory}
            variant="ghost"
            className="w-16 h-16 rounded-full border-2 border-dashed border-pink-300 hover:border-pink-500 hover:bg-pink-50 p-0"
          >
            <Plus className="w-6 h-6 text-pink-500" />
          </Button>
          <p className="text-xs text-gray-600 mt-1">Add Story</p>
        </div>

        {/* Story Avatars */}
        {authorGroups.map((group, groupIndex) => {
          const isOwnStory = visitor && group.authorId === visitor.id;
          return (
            <div key={group.authorId} className="flex-shrink-0 text-center">
              <button
                onClick={() => handleStoryClick(groupIndex)}
                className="relative block"
              >
                <div className={`w-16 h-16 rounded-full p-0.5 ${
                  isOwnStory 
                    ? 'bg-gradient-to-r from-green-400 to-blue-500'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600'
                }`}>
                  <Avatar className="w-full h-full border-2 border-white">
                    <AvatarImage src={group.latestStory.url} className="object-cover" />
                    <AvatarFallback className="bg-gray-200">
                      {group.latestStory.authorId?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {group.stories.length}
                </div>
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate w-16">
                {isOwnStory ? 'Your Story' : `Guest ${group.authorId.slice(-4)}`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stories Viewer */}
      <GuestStoriesViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        authorGroups={authorGroups}
        initialGroupIndex={selectedStoryIndex}
      />
    </div>
  );
};