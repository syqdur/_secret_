import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { GalleryProvider, useGallery } from '@/contexts/GalleryContext';
import { VisitorProvider, useVisitor } from '@/contexts/VisitorContext';
import { useAuth } from '@/contexts/AuthContext';
import { VisitorOnboarding } from '@/components/VisitorOnboarding';
import { GalleryHeader } from '@/components/GalleryHeader';
import { StoriesSection } from '@/components/StoriesSection';
import { GalleryFeed } from '@/components/GalleryFeed';
import { MusicWidget } from '@/components/MusicWidget';
import { TimelineWidget } from '@/components/TimelineWidget';
import { UploadModal } from '@/components/UploadModal';
import { AdminPanel } from '@/components/AdminPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Plus, 
  AlertCircle, 
  Users, 
  Images, 
  BarChart3, 
  X,
  Play,
  Pause
} from 'lucide-react';

interface GalleryPageProps {
  galleryId: string;
}

interface Story {
  id: string;
  url: string;
  authorName?: string;
  createdAt: Date;
  expiresAt?: Date;
}

function GalleryContent() {
  const { gallery, loading, error } = useGallery();
  const { visitor, isFirstTime } = useVisitor();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [showUpload, setShowUpload] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [stats, setStats] = useState({
    photos: 0,
    videos: 0,
    guests: 0,
    likes: 0,
  });

  // Check for admin parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    if (params.get('admin') === 'true' && user?.email === gallery?.ownerEmail) {
      setShowAdmin(true);
    }
  }, [location, user, gallery]);

  // Generate mock stats for demo
  useEffect(() => {
    if (gallery) {
      setStats({
        photos: Math.floor(Math.random() * 50) + 20,
        videos: Math.floor(Math.random() * 10) + 5,
        guests: Math.floor(Math.random() * 30) + 15,
        likes: Math.floor(Math.random() * 200) + 100,
      });
    }
  }, [gallery]);

  const handleStoryView = (story: Story) => {
    setCurrentStory(story);
    setShowStoryViewer(true);
  };

  const handleAddStory = () => {
    setShowUpload(true);
  };

  const closeStoryViewer = () => {
    setShowStoryViewer(false);
    setCurrentStory(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                </div>
              </div>
              <div className="flex space-x-2 animate-pulse">
                <div className="h-9 bg-gray-300 rounded w-20"></div>
                <div className="h-9 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Stories Skeleton */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 animate-pulse">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                  <div className="w-12 h-3 bg-gray-300 rounded mt-2 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Gallery Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || "This gallery doesn't exist or has been removed."}
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if gallery is live (unless user is owner)
  if (!gallery.isLive && user?.email !== gallery.ownerEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Pause className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Gallery is Private</h2>
            <p className="text-gray-600 mb-4">
              This gallery is currently private and not accessible to visitors.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Visitor Onboarding */}
      {isFirstTime && !user && <VisitorOnboarding />}

      <div className="min-h-screen bg-gray-50">
        {/* Gallery Header */}
        <GalleryHeader
          onUpload={() => setShowUpload(true)}
          onAdmin={() => setShowAdmin(true)}
        />

        {/* Stories Section */}
        <StoriesSection
          onAddStory={handleAddStory}
          onViewStory={handleStoryView}
        />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              <GalleryFeed />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Music Widget */}
              <MusicWidget />

              {/* Timeline Widget */}
              <TimelineWidget />

              {/* Stats Widget */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="w-5 h-5 text-pink-500 mr-2" />
                    Gallery Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-pink-500">{stats.photos}</p>
                      <p className="text-xs text-gray-600">Photos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-500">{stats.videos}</p>
                      <p className="text-xs text-gray-600">Videos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">{stats.guests}</p>
                      <p className="text-xs text-gray-600">Guests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">{stats.likes}</p>
                      <p className="text-xs text-gray-600">Likes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Upload Button */}
        {visitor && (
          <Button
            onClick={() => setShowUpload(true)}
            className="mobile-upload-btn lg:hidden w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} />

      {/* Admin Panel */}
      <AdminPanel open={showAdmin} onClose={() => setShowAdmin(false)} />

      {/* Story Viewer */}
      <Dialog open={showStoryViewer} onOpenChange={closeStoryViewer}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent">
          {currentStory && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeStoryViewer}
                className="absolute top-4 right-4 z-10 bg-black/20 text-white hover:bg-black/40"
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="bg-black rounded-lg overflow-hidden">
                <img
                  src={currentStory.url}
                  alt="Story"
                  className="w-full max-h-[80vh] object-contain"
                />
                <div className="p-4 text-white">
                  <p className="font-medium">{currentStory.authorName}</p>
                  <p className="text-sm text-gray-300">
                    {currentStory.createdAt && new Date(currentStory.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Gallery({ galleryId }: GalleryPageProps) {
  return (
    <GalleryProvider galleryId={galleryId}>
      <VisitorProvider galleryId={galleryId}>
        <GalleryContent />
      </VisitorProvider>
    </GalleryProvider>
  );
}
