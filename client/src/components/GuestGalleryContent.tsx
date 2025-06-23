import React, { useState, useEffect } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { VisitorOnboarding } from '@/components/VisitorOnboarding';
import { GuestStoriesSection } from '@/components/GuestStoriesSection';
import { GuestFeed } from '@/components/GuestFeed';
import { GuestUploadModal } from '@/components/GuestUploadModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Heart, MessageCircle, Users } from 'lucide-react';

export const GuestGalleryContent: React.FC = () => {
  const { gallery, loading: galleryLoading, error } = useGallery();
  const { visitor, isFirstTime } = useVisitor();
  const [showUpload, setShowUpload] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);

  if (galleryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Gallery Not Found</h1>
          <p className="text-gray-600">The gallery you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (isFirstTime) {
    return <VisitorOnboarding />;
  }

  const getThemeGradient = (theme: string) => {
    switch (theme) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getThemeGradient(gallery.theme)} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 border-4 border-white/20">
              <AvatarImage src={gallery.profileImage} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {gallery.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{gallery.name}</h1>
              <p className="text-white/90 mt-1">{gallery.bio}</p>
              <div className="flex items-center space-x-4 mt-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Users className="w-3 h-3 mr-1" />
                  Guest Gallery
                </Badge>
                {visitor && (
                  <span className="text-sm text-white/80">
                    Welcome, {visitor.name}!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo/Video
          </Button>
          <Button
            onClick={() => setShowStoryUpload(true)}
            variant="outline"
            className="border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Story
          </Button>
        </div>

        {/* Stories Section */}
        <GuestStoriesSection 
          onAddStory={() => setShowStoryUpload(true)}
        />

        {/* Feed */}
        <div className="mt-8">
          <GuestFeed />
        </div>
      </div>

      {/* Upload Modals */}
      <GuestUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        type="media"
      />
      <GuestUploadModal
        open={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        type="story"
      />
    </div>
  );
};