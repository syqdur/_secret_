import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Gallery } from '@shared/schema';
import { getGallery } from '@/lib/storage';

interface GalleryContextType {
  gallery: Gallery | null;
  loading: boolean;
  error: string | null;
}

const GalleryContext = createContext<GalleryContextType>({
  gallery: null,
  loading: true,
  error: null,
});

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};

interface GalleryProviderProps {
  children: React.ReactNode;
  galleryId?: string;
}

export const GalleryProvider: React.FC<GalleryProviderProps> = ({ children, galleryId }) => {
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!galleryId) {
      setLoading(false);
      return;
    }

    const loadGallery = async () => {
      try {
        setLoading(true);
        setError(null);
        const galleryData = await getGallery(galleryId);
        if (galleryData) {
          setGallery(galleryData);
        } else {
          setError('Gallery not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [galleryId]);

  const value = {
    gallery,
    loading,
    error,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};
