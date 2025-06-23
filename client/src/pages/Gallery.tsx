import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { GalleryProvider, useGallery } from '@/contexts/GalleryContext';
import { VisitorProvider, useVisitor } from '@/contexts/VisitorContext';
import { useAuth } from '@/contexts/AuthContext';
import { VisitorOnboarding } from '@/components/VisitorOnboarding';
import { GalleryHeader } from '@/components/GalleryHeader';
import { StoriesBar } from '@/components/StoriesBar';
import { StoriesViewer } from '@/components/StoriesViewer';
import { StoryUploadModal } from '@/components/StoryUploadModal';
import { GalleryFeed } from '@/components/GalleryFeed';
import { MusicWidget } from '@/components/MusicWidget';

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
  X,
  Play,
  Pause
} from 'lucide-react';
import { uploadFile, createMedia, getStories, deleteMedia } from '@/lib/storage';
import { Media } from '@shared/schema';

interface GalleryPageProps {
  galleryId: string;
}



function GalleryContent() {
  const { gallery, loading, error } = useGallery();
  const { visitor, isFirstTime } = useVisitor();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [showUpload, setShowUpload] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [storiesData, setStoriesData] = useState<Media[]>([]);


  // Check for admin parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    if (params.get('admin') === 'true' && user?.email === gallery?.ownerEmail) {
      setShowAdmin(true);
    }
  }, [location, user, gallery]);



  const handleStoryView = (story: Media) => {
    const storyIndex = storiesData.findIndex(s => s.id === story.id);
    setStoryViewerIndex(storyIndex >= 0 ? storyIndex : 0);
    setShowStoryViewer(true);
  };

  const handleAddStory = () => {
    setShowStoryUpload(true);
  };

  const handleStoryUpload = async (file: File, caption?: string) => {
    if (!gallery) return;
    
    try {
      const url = await uploadFile(file, gallery.id, 'story');
      await createMedia({
        galleryId: gallery.id,
        visitorId: visitor?.id || 'owner',
        url,
        type: 'story',
        caption: caption || undefined,
      });
      
      // Refresh stories data immediately
      const updatedStories = await getStories(gallery.id);
      setStoriesData(updatedStories);
      console.log('Stories refreshed:', updatedStories.length);
    } catch (error) {
      console.error('Error uploading story:', error);
      throw error;
    }
  };

  // Load stories data
  useEffect(() => {
    if (!gallery) return;

    const loadStories = async () => {
      try {
        const stories = await getStories(gallery.id);
        setStoriesData(stories);
        console.log('Gallery stories loaded:', stories.length);
      } catch (error) {
        console.error('Error loading stories:', error);
      }
    };

    loadStories();
    
    // Refresh stories every 30 seconds
    const interval = setInterval(loadStories, 30000);
    return () => clearInterval(interval);
  }, [gallery]);

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

  const isOwner = user?.email === gallery?.ownerEmail;

  return (
    <>
      {/* Visitor Onboarding - only for non-owners */}
      {isFirstTime && !user && !isOwner && <VisitorOnboarding />}

      <div className="min-h-screen bg-gray-50">
        {/* Gallery Header */}
        <GalleryHeader
          onUpload={() => setShowUpload(true)}
          onAdmin={() => setShowAdmin(true)}
        />

        {/* Stories Section */}
        <StoriesBar
          stories={storiesData}
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

      {/* Story Upload Modal */}
      <StoryUploadModal 
        open={showStoryUpload} 
        onClose={() => setShowStoryUpload(false)}
        onUpload={handleStoryUpload}
      />

      {/* Stories Viewer */}
      <StoriesViewer
        isOpen={showStoryViewer}
        stories={storiesData}
        initialStoryIndex={storyViewerIndex}
        onClose={() => setShowStoryViewer(false)}
      />

      {/* Admin Panel */}
      <AdminPanel open={showAdmin} onClose={() => setShowAdmin(false)} />
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
