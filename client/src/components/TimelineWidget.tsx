import React, { useState, useEffect } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { TimelineEntry } from '@shared/schema';
import { getTimeline } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Calendar, MapPin } from 'lucide-react';

export const TimelineWidget: React.FC = () => {
  const { gallery } = useGallery();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gallery) return;

    const loadTimeline = async () => {
      try {
        const timelineData = await getTimeline(gallery.id);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [gallery]);

  const getDefaultTimelineData = () => {
    switch (gallery?.theme) {
      case 'wedding':
        return [
          { title: 'First Met', description: 'Coffee shop encounter', date: '2018' },
          { title: 'First Date', description: 'Movie night', date: '2019' },
          { title: 'Proposal', description: 'Beach sunset', date: '2023' },
          { title: 'Wedding Day', description: 'Our special day', date: '2024' },
        ];
      case 'birthday':
        return [
          { title: 'Born', description: 'The beginning', date: '1990' },
          { title: 'Graduation', description: 'Academic achievement', date: '2012' },
          { title: 'First Job', description: 'Career start', date: '2013' },
          { title: 'Today', description: 'Celebrating another year', date: '2024' },
        ];
      case 'vacation':
        return [
          { title: 'Planning', description: 'Trip preparation', date: 'January' },
          { title: 'Departure', description: 'Adventure begins', date: 'March' },
          { title: 'Highlights', description: 'Amazing experiences', date: 'March' },
          { title: 'Return', description: 'Back home with memories', date: 'March' },
        ];
      default:
        return [
          { title: 'Beginning', description: 'It all started here', date: '2023' },
          { title: 'Milestone', description: 'Important moment', date: '2024' },
          { title: 'Today', description: 'Celebrating together', date: '2024' },
        ];
    }
  };

  const displayTimeline = timeline.length > 0 ? timeline : getDefaultTimelineData();

  const getThemeIcon = () => {
    switch (gallery?.theme) {
      case 'wedding':
        return Heart;
      case 'birthday':
        return Calendar;
      case 'vacation':
        return MapPin;
      default:
        return Heart;
    }
  };

  const getThemeTitle = () => {
    switch (gallery?.theme) {
      case 'wedding':
        return 'Our Story';
      case 'birthday':
        return 'Life Journey';
      case 'vacation':
        return 'Trip Timeline';
      default:
        return 'Our Story';
    }
  };

  const ThemeIcon = getThemeIcon();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Heart className="w-5 h-5 text-pink-500 mr-2" />
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
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
          <CardTitle className="flex items-center text-lg">
            <ThemeIcon className="w-5 h-5 text-pink-500 mr-2" />
            {getThemeTitle()}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {displayTimeline.slice(0, 3).map((entry, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800">{entry.title}</p>
                  <p className="text-xs text-gray-600">{entry.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
          
          {displayTimeline.length > 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullTimeline(true)}
              className="w-full mt-4 text-pink-500 border-pink-500 hover:bg-pink-50"
            >
              View Full Timeline
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showFullTimeline} onOpenChange={setShowFullTimeline}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ThemeIcon className="w-6 h-6 text-pink-500 mr-2" />
              {getThemeTitle()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {displayTimeline.map((entry, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  {index < displayTimeline.length - 1 && (
                    <div className="w-0.5 h-16 bg-gradient-to-b from-pink-500 to-purple-600 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-2">{entry.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{entry.description}</p>
                    <p className="text-gray-500 text-xs">{entry.date}</p>
                    {entry.image && (
                      <img
                        src={entry.image}
                        alt={entry.title}
                        className="w-full h-32 object-cover rounded mt-3"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
