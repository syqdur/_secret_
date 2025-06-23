import React from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Gift, Plane, Camera, Plus, Moon, Crown } from 'lucide-react';

interface GalleryHeaderProps {
  onUpload: () => void;
  onAdmin: () => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({ onUpload, onAdmin }) => {
  const { gallery } = useGallery();
  const { user } = useAuth();

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

  const getThemeGradient = () => {
    switch (gallery?.theme) {
      case 'wedding':
        return 'from-pink-500 to-purple-600';
      case 'birthday':
        return 'from-yellow-400 to-orange-500';
      case 'vacation':
        return 'from-blue-400 to-teal-500';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const getThemeDate = () => {
    switch (gallery?.theme) {
      case 'wedding':
        return 'October 15, 2024';
      case 'birthday':
        return 'Happy Birthday!';
      case 'vacation':
        return 'March 2024';
      default:
        return 'Special Moment';
    }
  };

  if (!gallery) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const ThemeIcon = getThemeIcon();
  const isOwner = user?.email === gallery.ownerEmail;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={gallery.profileImage} />
              <AvatarFallback className={`bg-gradient-to-r ${getThemeGradient()} text-white`}>
                <ThemeIcon className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{gallery.name}</h1>
              <p className="text-sm text-gray-600">{getThemeDate()}</p>
              {gallery.bio && (
                <p className="text-xs text-gray-500 max-w-md truncate">{gallery.bio}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!gallery.isLive && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                Private Gallery
              </div>
            )}
            
            <Button variant="ghost" size="sm">
              <Moon className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={onUpload}
              className={`bg-gradient-to-r ${getThemeGradient()} hover:opacity-90 text-white`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>

            {isOwner && (
              <Button
                onClick={onAdmin}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                <Crown className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
