import React, { useState, useRef } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { uploadFile, createMedia } from '@/lib/api-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Image, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/translations';

interface GuestUploadModalProps {
  open: boolean;
  onClose: () => void;
  type: 'media' | 'story';
}

export const GuestUploadModal: React.FC<GuestUploadModalProps> = ({ open, onClose, type }) => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Don't render modal if visitor is not available
  if (open && (!visitor || !visitor.id)) {
    console.log('Modal opened but visitor not available or invalid:', visitor);
    return null;
  }
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    console.log('Upload attempt with:', { selectedFile: !!selectedFile, gallery: !!gallery, visitor });
    
    if (!selectedFile || !gallery || !visitor || !visitor.id) {
      console.error('Upload validation failed:', { 
        selectedFile: !!selectedFile, 
        gallery: !!gallery, 
        visitor: visitor,
        visitorId: visitor?.id 
      });
      toast({
        title: "Upload Fehler",
        description: visitor ? "Besucher-ID fehlt - bitte Seite neu laden" : "Datei oder Galerie-Information fehlt",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log(`Uploading file: ${selectedFile.name} to gallery: ${gallery.id}`);
      
      // Determine upload type based on file and modal type
      const uploadType = type === 'story' ? 'story' : 
                        selectedFile.type.startsWith('video/') ? 'video' : 'photo';
      
      // Upload file to Firebase Storage
      const url = await uploadFile(selectedFile, gallery.id, uploadType);
      console.log('File uploaded successfully, creating media entry...');
      
      console.log('Creating media entry with visitor:', visitor);
      console.log('Visitor ID being used:', visitor.id);
      
      if (!visitor.id) {
        throw new Error('Visitor ID is missing');
      }

      // Create media entry in database
      await createMedia({
        galleryId: gallery.id,
        authorId: visitor.id,
        url,
        type: type === 'story' ? 'story' : selectedFile.type.startsWith('video/') ? 'video' : 'photo',
        caption: caption.trim() || undefined,
        expiresAt: type === 'story' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined, // 24h for stories
      });

      console.log('Media entry created successfully');
      
      // Refresh queries
      if (type === 'story') {
        queryClient.invalidateQueries({ queryKey: ['stories', gallery.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['media', gallery.id] });
      }
      
      toast({
        title: t('uploadSuccess'),
        description: type === 'story' ? t('storyUploaded') : t('postUploaded'),
      });
      
      // Reset form and close
      setSelectedFile(null);
      setCaption('');
      setPreview(null);
      onClose();
      console.log('Upload completed successfully');
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: t('uploadError'),
        description: "Datei-Upload fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setCaption('');
      setPreview(null);
      onClose();
    }
  };

  const acceptedTypes = type === 'story' 
    ? 'image/*,video/*' 
    : 'image/*,video/*';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'story' ? t('addStory') : t('uploadPhotoVideo')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('selectFile')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('supportedFormats')}
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t('selectFile')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="relative">
                {preview && (
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    {selectedFile.type.startsWith('video/') ? (
                      <video
                        src={preview}
                        className="w-full max-h-64 object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full max-h-64 object-contain"
                      />
                    )}
                    <Button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    {selectedFile.type.startsWith('video/') ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                    <span>{selectedFile.name}</span>
                    <span>({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                </div>
              </div>

              {/* Caption Input */}
              <div>
                <Label htmlFor="caption">
                  {t('addCaption')}
                </Label>
                <Textarea
                  id="caption"
                  placeholder={type === 'story' ? 'Story hinzufügen...' : 'Beschreibung hinzufügen...'}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="mt-1"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {caption.length}/500 Zeichen
                </p>
              </div>

              {/* Upload Button */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {type === 'story' ? t('uploadStory') : t('uploadMedia')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};