import React, { useState, useEffect } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Media, MusicRequest, Visitor } from '@shared/schema';
import { 
  getMedia, 
  getMusicRequests, 
  updateGallery,
  approveMusicRequest,
  deleteMedia
} from '@/lib/storage';
import { db } from '@/lib/firebase';
import { getDocs, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile } from '@/lib/storage';
import { 
  Crown, 
  BarChart3, 
  Images, 
  Music, 
  Users, 
  Settings, 
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  Check,
  X,
  Camera,
  Save,
  Share,
  Copy,
  ExternalLink
} from 'lucide-react';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ open, onClose }) => {
  const { gallery } = useGallery();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [media, setMedia] = useState<Media[]>([]);
  const [musicRequests, setMusicRequests] = useState<MusicRequest[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState({
    photos: 0,
    videos: 0,
    stories: 0,
    guests: 0,
    likes: 0,
    comments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    name: '',
    bio: '',
    profileImage: ''
  });

  useEffect(() => {
    if (!gallery || !open) return;

    // Initialize form with gallery data
    setGalleryForm({
      name: gallery.name || '',
      bio: gallery.bio || '',
      profileImage: gallery.profileImage || ''
    });

    const loadAdminData = async () => {
      try {
        setLoading(true);
        
        const [mediaData, musicData] = await Promise.all([
          getMedia(gallery.id),
          getMusicRequests(gallery.id),
        ]);

        // Load visitors
        const visitorsSnapshot = await getDocs(collection(db, `galleries/${gallery.id}/visitors`));
        const visitorsData = visitorsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastActive: doc.data().lastActive?.toDate() || new Date(),
        })) as Visitor[];

        // Load likes and comments for stats
        const likesSnapshot = await getDocs(collection(db, `galleries/${gallery.id}/likes`));
        const commentsSnapshot = await getDocs(collection(db, `galleries/${gallery.id}/comments`));

        setMedia(mediaData);
        setMusicRequests(musicData);
        setVisitors(visitorsData);

        // Calculate stats
        const photos = mediaData.filter(m => m.type === 'photo').length;
        const videos = mediaData.filter(m => m.type === 'video').length;
        const stories = mediaData.filter(m => m.type === 'story').length;

        setStats({
          photos,
          videos,
          stories,
          guests: visitorsData.length,
          likes: likesSnapshot.size,
          comments: commentsSnapshot.size,
        });
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [gallery, open]);

  const handleToggleGallery = async () => {
    if (!gallery) return;

    try {
      await updateGallery(gallery.id, { isLive: !gallery.isLive });
      // Refresh gallery data would need to be handled by parent component
    } catch (error) {
      console.error('Error toggling gallery:', error);
    }
  };

  const handleApproveMusic = async (requestId: string) => {
    if (!gallery) return;

    try {
      await approveMusicRequest(gallery.id, requestId);
      setMusicRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, approved: true } : req
        )
      );
    } catch (error) {
      console.error('Error approving music request:', error);
    }
  };

  const handleDeleteMedia = async (mediaItem: Media) => {
    if (!gallery) return;

    if (window.confirm('Are you sure you want to delete this media?')) {
      try {
        await deleteMedia(gallery.id, mediaItem.id, mediaItem.url);
        setMedia(prev => prev.filter(m => m.id !== mediaItem.id));
      } catch (error) {
        console.error('Error deleting media:', error);
      }
    }
  };

  const handleProfileImageUpload = async (file: File) => {
    if (!gallery) return;
    
    try {
      setUploading(true);
      const imageUrl = await uploadFile(file, gallery.id, 'profile');
      setGalleryForm(prev => ({ ...prev, profileImage: imageUrl }));
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGalleryDetails = async () => {
    if (!gallery) return;
    
    try {
      setLoading(true);
      await updateGallery(gallery.id, {
        name: galleryForm.name,
        bio: galleryForm.bio,
        profileImage: galleryForm.profileImage
      });
      setEditMode(false);
      alert('Gallery details updated successfully!');
      window.location.reload(); // Refresh to show changes
    } catch (error) {
      console.error('Error updating gallery:', error);
      alert('Failed to update gallery details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!gallery || !user || gallery.ownerEmail !== user.email) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="h-full flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 text-white p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold">Admin Panel</h2>
                <p className="text-sm text-gray-400">Gallery Manager</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'gallery' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('gallery')}
              >
                <Images className="w-4 h-4 mr-3" />
                Gallery
              </Button>
              <Button
                variant={activeTab === 'music' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('music')}
              >
                <Music className="w-4 h-4 mr-3" />
                Music Requests
              </Button>
              <Button
                variant={activeTab === 'guests' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('guests')}
              >
                <Users className="w-4 h-4 mr-3" />
                Guests
              </Button>
              <Button
                variant={activeTab === 'share' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('share')}
              >
                <Share className="w-4 h-4 mr-3" />
                Share Gallery
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="w-4 h-4 mr-3" />
                Gallery Settings
              </Button>
            </nav>
            
            <div className="mt-8 pt-8 border-t border-gray-700">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white"
                onClick={onClose}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Exit Admin
              </Button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 bg-gray-100 overflow-y-auto">
            <div className="p-8">
              {activeTab === 'dashboard' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gallery Dashboard</h1>
                    <div className="flex items-center space-x-4">
                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Gallery Status:</span>
                        <Badge variant={gallery.isLive ? 'default' : 'secondary'}>
                          {gallery.isLive ? 'Live' : 'Private'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <Switch
                          checked={gallery.isLive}
                          onCheckedChange={handleToggleGallery}
                        />
                        <span className="text-sm text-gray-600">
                          {gallery.isLive ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Photos</p>
                            <p className="text-3xl font-bold text-pink-500">{stats.photos}</p>
                          </div>
                          <Images className="w-8 h-8 text-pink-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Videos</p>
                            <p className="text-3xl font-bold text-purple-500">{stats.videos}</p>
                          </div>
                          <Images className="w-8 h-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Active Guests</p>
                            <p className="text-3xl font-bold text-blue-500">{stats.guests}</p>
                          </div>
                          <Users className="w-8 h-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Engagement</p>
                            <p className="text-3xl font-bold text-green-500">{stats.likes + stats.comments}</p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Gallery Management</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {media.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="relative">
                          {item.type === 'video' ? (
                            <video
                              src={item.url}
                              className="w-full h-48 object-cover"
                              controls={false}
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt="Gallery content"
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <Badge variant={item.type === 'story' ? 'destructive' : 'secondary'}>
                              {item.type}
                            </Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMedia(item)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600 truncate">
                            {item.caption || 'No caption'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'music' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Music Requests</h2>
                  <div className="space-y-4">
                    {musicRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {request.albumCover ? (
                              <img
                                src={request.albumCover}
                                alt={`${request.trackName} album cover`}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">
                                <Music className="w-6 h-6 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{request.trackName}</p>
                              <p className="text-sm text-gray-600">{request.artistName}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={request.approved ? 'default' : 'secondary'}>
                              {request.approved ? 'Approved' : 'Pending'}
                            </Badge>
                            {!request.approved && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveMusic(request.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'guests' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Guest Overview</h2>
                  <div className="space-y-4">
                    {visitors.map((visitor) => (
                      <Card key={visitor.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{visitor.name}</p>
                            <p className="text-sm text-gray-600">
                              Joined {visitor.createdAt.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Last active: {visitor.lastActive.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'share' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Share Gallery</h2>
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Share className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Guest Gallery Link</h3>
                            <p className="text-sm text-gray-600">Share this link with your guests to allow them to view and contribute to the gallery</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <Input
                              value={`${window.location.origin}/guest/${gallery.id}`}
                              readOnly
                              className="flex-1 bg-white border-gray-300"
                            />
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/guest/${gallery.id}`);
                                alert('Guest link copied to clipboard!');
                              }}
                              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mb-4">
                          <Button
                            onClick={() => window.open(`/guest/${gallery.id}`, '_blank')}
                            variant="outline"
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Preview Guest View
                          </Button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2">What guests can do:</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• View all photos and videos in the gallery</li>
                            <li>• Upload their own photos and videos</li>
                            <li>• Add 24-hour stories that disappear automatically</li>
                            <li>• Like and comment on posts</li>
                            <li>• Only edit or delete their own content</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Guest Registration</h3>
                            <p className="text-sm text-gray-600">Guests will be asked to enter their name when first visiting</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>No accounts required!</strong> Guests are identified by their device and chosen name.
                          </p>
                          <p className="text-xs text-gray-500">
                            Examples: "Julia H. from Table 4", "Mike - Best Man", "Sarah (Sister)"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gallery Settings</h1>
                    {!editMode ? (
                      <Button onClick={() => setEditMode(true)} className="bg-gradient-to-r from-pink-500 to-purple-600">
                        Edit Details
                      </Button>
                    ) : (
                      <div className="flex space-x-3">
                        <Button onClick={() => setEditMode(false)} variant="outline">
                          Cancel
                        </Button>
                        <Button onClick={handleSaveGalleryDetails} disabled={loading} className="bg-gradient-to-r from-pink-500 to-purple-600">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>

                  <Card className="p-8">
                    <div className="space-y-8">
                      {/* Profile Image Section */}
                      <div className="flex items-center space-x-6">
                        <Avatar className="w-24 h-24">
                          {galleryForm.profileImage ? (
                            <AvatarImage src={galleryForm.profileImage} alt="Gallery" />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl">
                              {galleryForm.name.charAt(0) || 'G'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {editMode && (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleProfileImageUpload(file);
                              }}
                              className="hidden"
                              id="profile-upload"
                              disabled={uploading}
                            />
                            <Label htmlFor="profile-upload">
                              <Button variant="outline" asChild disabled={uploading}>
                                <span>
                                  <Camera className="w-4 h-4 mr-2" />
                                  {uploading ? 'Uploading...' : 'Change Photo'}
                                </span>
                              </Button>
                            </Label>
                          </div>
                        )}
                      </div>

                      {/* Gallery Name */}
                      <div className="space-y-3">
                        <Label htmlFor="gallery-name" className="text-lg font-medium">Gallery Name</Label>
                        {editMode ? (
                          <Input
                            id="gallery-name"
                            value={galleryForm.name}
                            onChange={(e) => setGalleryForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter gallery name"
                            className="text-lg"
                          />
                        ) : (
                          <p className="text-xl font-medium text-gray-800">{gallery?.name || 'Untitled Gallery'}</p>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="space-y-3">
                        <Label htmlFor="gallery-bio" className="text-lg font-medium">Bio / Description</Label>
                        {editMode ? (
                          <Textarea
                            id="gallery-bio"
                            value={galleryForm.bio}
                            onChange={(e) => setGalleryForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell people about this gallery..."
                            rows={4}
                            className="text-base"
                          />
                        ) : (
                          <p className="text-gray-600 text-base leading-relaxed">{gallery?.bio || 'No description yet.'}</p>
                        )}
                      </div>

                      {/* Gallery Information */}
                      <div className="border-t pt-6 space-y-4">
                        <h3 className="text-lg font-medium">Gallery Information</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <span className="text-gray-500 font-medium">Theme:</span>
                            <p className="text-gray-800 capitalize mt-1">{gallery?.theme}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Created:</span>
                            <p className="text-gray-800 mt-1">{gallery?.createdAt ? new Date(gallery.createdAt).toLocaleDateString() : 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Owner:</span>
                            <p className="text-gray-800 mt-1">{gallery?.ownerEmail}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Status:</span>
                            <Badge variant={gallery?.isLive ? 'default' : 'secondary'} className="mt-1">
                              {gallery?.isLive ? 'Live' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
