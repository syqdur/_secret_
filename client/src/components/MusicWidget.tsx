import React, { useState, useEffect } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { MusicRequest, Visitor } from '@shared/schema';
import { getMusicRequests, createMusicRequest, getVisitor } from '@/lib/storage';
import { searchSpotifyTracks, SpotifyTrack } from '@/lib/spotify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Music, Plus, Search, Clock } from 'lucide-react';

interface MusicRequestWithAuthor extends MusicRequest {
  authorName?: string;
}

export const MusicWidget: React.FC = () => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const [requests, setRequests] = useState<MusicRequestWithAuthor[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gallery) return;

    const loadRequests = async () => {
      try {
        const requestsData = await getMusicRequests(gallery.id);
        
        const requestsWithAuthors = await Promise.all(
          requestsData.map(async (request) => {
            try {
              const author = await getVisitor(gallery.id, request.visitorId);
              return {
                ...request,
                authorName: author?.name || 'Unknown',
              };
            } catch {
              return {
                ...request,
                authorName: 'Unknown',
              };
            }
          })
        );

        setRequests(requestsWithAuthors);
      } catch (error) {
        console.error('Error loading music requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [gallery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchSpotifyTracks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestSong = async (track: SpotifyTrack) => {
    if (!gallery || !visitor) return;

    try {
      await createMusicRequest({
        galleryId: gallery.id,
        visitorId: visitor.id,
        spotifyTrackId: track.id,
        trackName: track.name,
        artistName: track.artists[0]?.name || 'Unknown Artist',
        albumCover: track.album.images[0]?.url,
        approved: false,
      });

      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Reload requests
      const requestsData = await getMusicRequests(gallery.id);
      const requestsWithAuthors = await Promise.all(
        requestsData.map(async (request) => {
          try {
            const author = await getVisitor(gallery.id, request.visitorId);
            return {
              ...request,
              authorName: author?.name || 'Unknown',
            };
          } catch {
            return {
              ...request,
              authorName: 'Unknown',
            };
          }
        })
      );
      setRequests(requestsWithAuthors);
    } catch (error) {
      console.error('Error requesting song:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Music className="w-5 h-5 text-pink-500 mr-2" />
            Music Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Music className="w-5 h-5 text-pink-500 mr-2" />
              Music Requests
            </CardTitle>
            {visitor && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSearch(true)}
                className="text-pink-500 hover:text-pink-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6">
              <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No music requests yet</p>
              {visitor && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSearch(true)}
                  className="mt-2"
                >
                  Request a Song
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                  {request.albumCover ? (
                    <img
                      src={request.albumCover}
                      alt={`${request.trackName} album cover`}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{request.trackName}</p>
                    <p className="text-xs text-gray-600">
                      by {request.artistName} • Requested by {request.authorName}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {request.approved ? (
                        <Badge variant="default" className="text-xs">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {requests.length > 5 && (
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Requests ({requests.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request a Song</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search for a song or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {isSearching && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Searching...</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleRequestSong(track)}
                  >
                    {track.album.images[0] ? (
                      <img
                        src={track.album.images[0].url}
                        alt={`${track.name} album cover`}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{track.name}</p>
                      <p className="text-sm text-gray-600">
                        {track.artists.map(artist => artist.name).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">{track.album.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
