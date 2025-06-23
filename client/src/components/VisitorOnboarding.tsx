import React, { useState } from 'react';
import { t } from '@/lib/translations';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Camera, MessageCircle } from 'lucide-react';

export const VisitorOnboarding: React.FC = () => {
  const { gallery } = useGallery();
  const { registerVisitor } = useVisitor();
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gallery) return;

    setIsRegistering(true);
    try {
      console.log('Onboarding: Attempting to register visitor with name:', name.trim());
      await registerVisitor(gallery.id, name.trim());
      console.log('Onboarding: Visitor registration successful');
    } catch (error) {
      console.error('Onboarding: Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Onboarding: Error details:', errorMessage);
      
      // Provide user-friendly error message
      let friendlyMessage = 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      if (errorMessage.includes('auth/admin-restricted-operation')) {
        friendlyMessage = 'Gast-Registrierung ist temporär nicht verfügbar. Bitte versuchen Sie es später erneut.';
      } else if (errorMessage.includes('Failed to create visitor')) {
        friendlyMessage = 'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
      }
      
      alert(friendlyMessage);
    } finally {
      setIsRegistering(false);
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

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('galleryLoading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Gallery Header */}
        <div className={`bg-gradient-to-r ${getThemeGradient(gallery.theme)} text-white rounded-t-xl p-8 text-center`}>
          <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white/20">
            <AvatarImage src={gallery.profileImage} />
            <AvatarFallback className="bg-white/20 text-white text-2xl">
              {gallery.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold mb-2">{gallery.name}</h1>
          <p className="text-white/90 mb-4">{gallery.bio}</p>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            <Users className="w-3 h-3 mr-1" />
            Guest Gallery
          </Badge>
        </div>

        {/* Registration Form */}
        <Card className="rounded-t-none border-t-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-800">{t('welcomeToGallery')}</CardTitle>
            <p className="text-gray-600 text-sm">
              {t('enterYourName')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  {t('yourName')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Julia H. von Tisch 4"
                  className="mt-1"
                  required
                  disabled={isRegistering}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dies hilft anderen, Sie in der Galerie zu identifizieren
                </p>
              </div>

              <Button
                type="submit"
                disabled={!name.trim() || isRegistering}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                {isRegistering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('loading')}
                  </>
                ) : (
                  t('joinGallery')
                )}
              </Button>
            </form>

            {/* Features Preview */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">What you can do:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Camera className="w-4 h-4 text-pink-500" />
                  <span>Upload photos</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span>Like posts</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MessageCircle className="w-4 h-4 text-pink-500" />
                  <span>Add comments</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-pink-500" />
                  <span>Share stories</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Privacy:</strong> No account needed! You're identified by your device and chosen name. 
                You can only edit or delete your own content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};