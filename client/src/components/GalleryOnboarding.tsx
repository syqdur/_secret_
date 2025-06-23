import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createGallery, uploadFile, updateGallery } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Heart, Camera, Plane, Gift } from 'lucide-react';

const gallerySetupSchema = z.object({
  name: z.string().min(1, 'Gallery name is required'),
  theme: z.enum(['wedding', 'birthday', 'vacation', 'custom']),
  customTheme: z.string().optional(),
  bio: z.string().optional(),
});

type GallerySetupForm = z.infer<typeof gallerySetupSchema>;

interface GalleryOnboardingProps {
  onComplete: (galleryId: string) => void;
}

export const GalleryOnboarding: React.FC<GalleryOnboardingProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<GallerySetupForm>({
    resolver: zodResolver(gallerySetupSchema),
    defaultValues: {
      theme: 'wedding',
    },
  });

  const selectedTheme = watch('theme');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: GallerySetupForm) => {
    if (!user?.email) return;

    setIsSubmitting(true);
    try {
      const galleryId = `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create gallery first without profile image
      await createGallery({
        id: galleryId,
        name: data.name,
        ownerEmail: user.email,
        theme: data.theme,
        customTheme: data.customTheme,
        profileImage: '',
        bio: data.bio,
        isLive: true,
      });

      // Skip profile image upload for now due to Firebase permissions
      // Will be enabled once Firebase rules are configured

      onComplete(galleryId);
    } catch (error) {
      console.error('Error creating gallery:', error);
      alert('Failed to create gallery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeIcons = {
    wedding: Heart,
    birthday: Gift,
    vacation: Plane,
    custom: Camera,
  };

  const themeColors = {
    wedding: 'from-pink-500 to-purple-600',
    birthday: 'from-yellow-400 to-orange-500',
    vacation: 'from-blue-400 to-teal-500',
    custom: 'from-gray-500 to-gray-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">Create Your Gallery</CardTitle>
          <p className="text-gray-600">Set up your special event gallery to start collecting memories</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImagePreview} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl">
                    <Camera className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-2">Upload a profile picture for your gallery</p>
            </div>

            {/* Gallery Name */}
            <div>
              <Label htmlFor="name">Gallery Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Sarah & Mike's Wedding"
                className="mt-1"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Theme Selection */}
            <div>
              <Label>Choose Your Theme</Label>
              <RadioGroup
                value={selectedTheme}
                onValueChange={(value) => setValue('theme', value as 'wedding' | 'birthday' | 'vacation' | 'custom')}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                {Object.entries(themeIcons).map(([theme, Icon]) => (
                  <div key={theme} className="flex items-center space-x-2">
                    <RadioGroupItem value={theme} id={theme} />
                    <Label
                      htmlFor={theme}
                      className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTheme === theme
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-r ${themeColors[theme as keyof typeof themeColors]} rounded-full flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="capitalize font-medium">{theme}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Custom Theme Input */}
            {selectedTheme === 'custom' && (
              <div>
                <Label htmlFor="customTheme">Custom Theme Name</Label>
                <Input
                  id="customTheme"
                  {...register('customTheme')}
                  placeholder="e.g., Family Reunion, Graduation Party"
                  className="mt-1"
                />
              </div>
            )}

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Gallery Description (Optional)</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Share a little about your special event..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isSubmitting ? 'Creating Gallery...' : 'Create Gallery'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
