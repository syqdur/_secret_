import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { GalleryProvider } from '@/contexts/GalleryContext';
import { VisitorProvider } from '@/contexts/VisitorContext';
import { GuestGalleryContent } from '@/components/GuestGalleryContent';

export const GuestGallery: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();

  if (!galleryId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Gallery Link</h1>
          <p className="text-gray-600">The gallery link appears to be invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <GalleryProvider galleryId={galleryId}>
      <VisitorProvider galleryId={galleryId}>
        <GuestGalleryContent />
      </VisitorProvider>
    </GalleryProvider>
  );
};