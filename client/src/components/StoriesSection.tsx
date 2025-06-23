import React, { useEffect, useState } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { Media, Visitor } from '@shared/schema';
import { getStories, getVisitor } from '@/lib/storage';
import { Plus } from 'lucide-react';

interface Story extends Media {
  authorName?: string;
}

interface StoriesSectionProps {
  onAddStory: () => void;
  onViewStory: (story: Story) => void;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({ onAddStory, onViewStory }) => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gallery) return;

    const loadStories = async () => {
      try {
        const storiesData = await getStories(gallery.id);
        
        // Get author names for stories
        const storiesWithAuthors = await Promise.all(
          storiesData.map(async (story) => {
            try {
              const author = await getVisitor(gallery.id, story.visitorId);
              return {
                ...story,
                authorName: author?.name || 'Unknown',
              };
            } catch {
              return {
                ...story,
                authorName: 'Unknown',
              };
            }
          })
        );

        setStories(storiesWithAuthors);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();

    // Set up real-time updates
    const interval = setInterval(loadStories, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [gallery]);

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

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {stories.map((story) => (
            <div
              key={story.id}
              className="flex-shrink-0 text-center cursor-pointer"
              onClick={() => onViewStory(story)}
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${getThemeGradient()}`}>
                <img
                  src={story.url}
                  alt={`Story by ${story.authorName}`}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 truncate w-16">
                {story.authorName}
              </p>
            </div>
          ))}
          
          {visitor && (
            <div className="flex-shrink-0 text-center cursor-pointer" onClick={onAddStory}>
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-pink-500 transition-colors">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Your Story</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
