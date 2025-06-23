import React, { useState, useRef } from 'react';
import { useGallery } from '@/contexts/GalleryContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { uploadFile, createMedia } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Camera, Video, Clock, Image as ImageIcon } from 'lucide-react';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ open, onClose }) => {
  const { gallery } = useGallery();
  const { visitor } = useVisitor();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [uploadType, setUploadType] = useState<'photo' | 'video' | 'story'>('photo');
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (uploadType === 'photo' || uploadType === 'story') {
        return file.type.startsWith('image/');
      } else {
        return file.type.startsWith('video/');
      }
    });

    setSelectedFiles(validFiles);

    // Generate previews
    const newPreviews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!gallery || !visitor || selectedFiles.length === 0) {
      console.log('Upload blocked - missing requirements:', { gallery: !!gallery, visitor: !!visitor, files: selectedFiles.length });
      return;
    }

    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        console.log('Uploading file:', file.name, 'to gallery:', gallery.id);
        const url = await uploadFile(file, gallery.id, uploadType);
        console.log('File uploaded successfully, creating media entry...');
        
        await createMedia({
          galleryId: gallery.id,
          visitorId: visitor.id,
          url,
          type: uploadType,
          caption: caption.trim() || undefined,
        });
        console.log('Media entry created successfully');
      }

      // Reset form
      setSelectedFiles([]);
      setPreviews([]);
      setCaption('');
      onClose();
      console.log('Upload completed successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload content. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setCaption('');
    setUploadType('photo');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Share a Memory</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Upload Type Selection */}
          <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as typeof uploadType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="photo" className="flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Photo</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span>Video</span>
              </TabsTrigger>
              <TabsTrigger value="story" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Story</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="mt-4">
              <p className="text-sm text-gray-600">
                Share photos that will be visible to everyone in the gallery.
              </p>
            </TabsContent>
            <TabsContent value="video" className="mt-4">
              <p className="text-sm text-gray-600">
                Upload videos to share special moments with everyone.
              </p>
            </TabsContent>
            <TabsContent value="story" className="mt-4">
              <p className="text-sm text-gray-600">
                Share a story that will disappear after 24 hours.
              </p>
            </TabsContent>
          </Tabs>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {previews.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative">
                    {uploadType === 'video' ? (
                      <video
                        src={preview}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag & drop your {uploadType}s here
                </p>
                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                <Button variant="outline">
                  Choose Files
                </Button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={uploadType === 'video' ? 'video/*' : 'image/*'}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Add a caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share the story behind this moment..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Share with Everyone
              </>
            )}
          </Button>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
};
