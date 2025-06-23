import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logout } from '@/lib/auth';
import { Gallery } from '@shared/schema';
import { GalleryOnboarding } from '@/components/GalleryOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Gift, 
  Plane, 
  Camera, 
  Plus, 
  LogOut, 
  Eye, 
  EyeOff,
  Users,
  Images,
  Calendar,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const loadUserGalleries = async () => {
      try {
        const galleriesRef = collection(db, 'galleries');
        const q = query(galleriesRef, where('ownerEmail', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        const galleriesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Gallery;
        });

        setGalleries(galleriesData);
      } catch (error) {
        console.error('Error loading galleries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserGalleries();
  }, [user?.email]);

  const handleCreateGallery = () => {
    setShowOnboarding(true);
  };

  const handleGalleryCreated = (galleryId: string) => {
    setShowOnboarding(false);
    setLocation(`/gallery/${galleryId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getThemeIcon = (theme: string, customTheme?: string) => {
    switch (theme) {
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

  const getDisplayTheme = (theme: string, customTheme?: string) => {
    if (theme === 'custom' && customTheme) {
      return customTheme;
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  if (showOnboarding) {
    return <GalleryOnboarding onComplete={handleGalleryCreated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">WeddingPix</h1>
                <p className="text-sm text-gray-600">Gallery Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                <p className="text-xs text-gray-600">Gallery Owner</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
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
        ) : galleries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Plus className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Your First Gallery</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start collecting beautiful memories from your special events. Create a gallery for weddings, 
              birthdays, vacations, or any special moment.
            </p>
            <Button
              onClick={handleCreateGallery}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Gallery
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-pink-500 mb-1">{galleries.length}</div>
                  <div className="text-sm text-gray-600">Total Galleries</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500 mb-1">
                    {galleries.filter(g => g.isLive).length}
                  </div>
                  <div className="text-sm text-gray-600">Live Galleries</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500 mb-1">
                    {galleries.filter(g => g.theme === 'wedding').length}
                  </div>
                  <div className="text-sm text-gray-600">Weddings</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500 mb-1">
                    {galleries.filter(g => new Date(g.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                  </div>
                  <div className="text-sm text-gray-600">Recent</div>
                </CardContent>
              </Card>
            </div>

            {/* Header with Create Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Galleries</h2>
              <Button
                onClick={handleCreateGallery}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Gallery
              </Button>
            </div>

            {/* Galleries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleries.map((gallery) => {
                const ThemeIcon = getThemeIcon(gallery.theme, gallery.customTheme);
                const themeGradient = getThemeGradient(gallery.theme);
                
                return (
                  <Card key={gallery.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={gallery.profileImage} />
                            <AvatarFallback className={`bg-gradient-to-r ${themeGradient} text-white`}>
                              <ThemeIcon className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{gallery.name}</CardTitle>
                            <p className="text-sm text-gray-600 flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDistanceToNow(gallery.createdAt, { addSuffix: true })}</span>
                            </p>
                          </div>
                        </div>
                        <Badge variant={gallery.isLive ? 'default' : 'secondary'}>
                          {gallery.isLive ? (
                            <><Eye className="w-3 h-3 mr-1" />Live</>
                          ) : (
                            <><EyeOff className="w-3 h-3 mr-1" />Private</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Theme:</span>
                          <Badge variant="outline" className="text-xs">
                            {getDisplayTheme(gallery.theme, gallery.customTheme)}
                          </Badge>
                        </div>
                        
                        {gallery.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2">{gallery.bio}</p>
                        )}
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/gallery/${gallery.id}`)}
                            className="flex-1 mr-2"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Gallery
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/gallery/${gallery.id}?admin=true`)}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
