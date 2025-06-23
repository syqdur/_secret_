import React, { useState } from 'react';
import { useVisitor } from '@/contexts/VisitorContext';
import { useGallery } from '@/contexts/GalleryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Gift, Plane, Camera } from 'lucide-react';

export const VisitorOnboarding: React.FC = () => {
  const { gallery } = useGallery();
  const { registerVisitor } = useVisitor();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gallery) return;

    setIsSubmitting(true);
    try {
      console.log('Starting visitor registration for:', name.trim());
      await registerVisitor(gallery.id, name.trim());
      console.log('Visitor registration completed successfully');
    } catch (error) {
      console.error('Error registering visitor:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const ThemeIcon = getThemeIcon();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="text-center">
          <div className={`w-20 h-20 bg-gradient-to-r ${getThemeGradient()} rounded-full mx-auto mb-4 flex items-center justify-center`}>
            <ThemeIcon className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Welcome to {gallery?.name}
          </CardTitle>
          <p className="text-gray-600">Join the celebration and share your memories!</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="visitorName">How should we call you?</Label>
              <Input
                id="visitorName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Julia from Table 4"
                className="mt-1"
                autoFocus
              />
            </div>
            
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className={`w-full bg-gradient-to-r ${getThemeGradient()} hover:opacity-90 transition-opacity`}
            >
              {isSubmitting ? 'Joining...' : 'Join the Gallery'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
