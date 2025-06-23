import React, { useState, useRef } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile, createMedia } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Upload, Camera, Video, Plus } from 'lucide-react';

interface StoryUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload?: (file: File, caption?: string) => Promise<void>;
}

export const StoryUploadModal: React.FC<StoryUploadModalProps> = ({ open, onClose, onUpload }) => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user?.email === gallery?.ownerEmail;

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Check if it's image or video
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!gallery || (!visitor && !isOwner) || !selectedFile) {
      if (!selectedFile) {
        alert('Please select a file to upload');
        return;
      }
      if (!visitor && !isOwner) {
        alert('Please complete your registration first');
        return;
      }
      return;
    }

    setIsUploading(true);
    try {
      console.log('Uploading story:', selectedFile.name, 'to gallery:', gallery.id);
      
      if (onUpload) {
        // Use parent's upload handler if provided
        await onUpload(selectedFile, caption.trim() || undefined);
      } else {
        // Fallback to direct upload
        const url = await uploadFile(selectedFile, gallery.id, 'story');
        await createMedia({
          galleryId: gallery.id,
          visitorId: visitor?.id || 'owner',
          url,
          type: 'story',
          caption: caption.trim() || undefined,
        });
      }

      // Reset form
      setSelectedFile(null);
      setPreview('');
      setCaption('');
      onClose();
      console.log('Story upload completed successfully');
    } catch (error) {
      console.error('Error uploading story:', error);
      alert('Failed to upload story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreview('');
    setCaption('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-hidden">
        <DialogTitle className="sr-only">Add to Story</DialogTitle>
        <DialogDescription className="sr-only">
          Upload a photo or video to your story that will disappear after 24 hours
        </DialogDescription>
        
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add to Story</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Story Preview Area - 9:16 aspect ratio */}
          <div className="relative w-full aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
            {preview ? (
              <>
                {selectedFile?.type.startsWith('video/') ? (
                  <video
                    src={preview}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                )}
                {caption && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
                      <p className="text-sm">{caption}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div 
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-600 font-medium">Add Photo or Video</p>
                <p className="text-gray-500 text-sm">Tap to select</p>
              </div>
            )}
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {/* Caption Input */}
          {selectedFile && (
            <div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="resize-none"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {caption.length}/200
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedFile && (
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={resetModal}
                className="flex-1"
                disabled={isUploading}
              >
                Change
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isUploading ? 'Sharing...' : 'Share Story'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};