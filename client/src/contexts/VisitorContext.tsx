import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Visitor } from '@shared/schema';
import { registerVisitor, findVisitorByDevice, updateVisitorActivity } from '@/lib/api-storage';
import { signInAsGuest } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

interface VisitorContextType {
  visitor: Visitor | null;
  isFirstTime: boolean;
  registerVisitor: (galleryId: string, name: string) => Promise<void>;
  updateActivity: () => Promise<void>;
}

const VisitorContext = createContext<VisitorContextType>({
  visitor: null,
  isFirstTime: false,
  registerVisitor: async () => {},
  updateActivity: async () => {},
});

export const useVisitor = () => {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitor must be used within a VisitorProvider');
  }
  return context;
};

interface VisitorProviderProps {
  children: React.ReactNode;
  galleryId?: string;
}

const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');
  
  return btoa(fingerprint).slice(0, 32);
};

export const VisitorProvider: React.FC<VisitorProviderProps> = ({ children, galleryId }) => {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!galleryId) return;

    const initializeVisitor = async () => {
      // Ensure anonymous authentication for guests
      if (!user) {
        try {
          console.log('Signing in anonymously for guest visitor...');
          await signInAsGuest();
        } catch (error) {
          console.error('Failed to sign in anonymously:', error);
        }
      }

      const deviceId = localStorage.getItem(`weddingpix_device_${galleryId}`) || uuidv4();
      localStorage.setItem(`weddingpix_device_${galleryId}`, deviceId);

      try {
        // Try to get cached visitor first
        const cachedVisitor = localStorage.getItem(`weddingpix_visitor_${galleryId}`);
        if (cachedVisitor) {
          const parsedVisitor = JSON.parse(cachedVisitor);
          setVisitor(parsedVisitor);
          setIsFirstTime(false);
          return;
        }

        const fingerprint = generateDeviceFingerprint();
        const existingVisitor = await findVisitorByDevice(galleryId, deviceId, fingerprint);
        if (existingVisitor) {
          console.log('Found existing visitor:', existingVisitor);
          setVisitor(existingVisitor);
          setIsFirstTime(false);
          localStorage.setItem(`weddingpix_visitor_${galleryId}`, JSON.stringify(existingVisitor));
          // Update last active
          await updateVisitorActivity(existingVisitor.id);
        } else {
          console.log('No existing visitor found, showing onboarding');
          setIsFirstTime(true);
        }
      } catch (error) {
        console.error('Error initializing visitor:', error);
        setIsFirstTime(true);
      }
    };

    initializeVisitor();
  }, [galleryId, user]);

  const registerVisitor = async (galleryId: string, name: string) => {
    try {
      console.log('Context: Starting visitor registration for:', { galleryId, name });
      
      const deviceId = localStorage.getItem(`weddingpix_device_${galleryId}`) || uuidv4();
      const fingerprint = generateDeviceFingerprint();
      
      console.log('Context: Creating visitor with data:', { galleryId, name, deviceId, fingerprint });
      
      const newVisitor = await createVisitor({
        galleryId,
        name: name.trim(),
        deviceId,
        fingerprint,
      });
      
      console.log('Context: Visitor created successfully:', newVisitor);

      if (!newVisitor || !newVisitor.id) {
        throw new Error('Failed to create visitor - invalid response');
      }

      setVisitor(newVisitor);
      setIsFirstTime(false);
      
      localStorage.setItem(`weddingpix_device_${galleryId}`, deviceId);
      localStorage.setItem(`weddingpix_visitor_${galleryId}`, JSON.stringify(newVisitor));
      
      console.log('Context: Visitor registration completed');
    } catch (error) {
      console.error('Context: Error registering visitor:', error);
      throw error;
    }
  };

  const updateActivity = async () => {
    if (visitor) {
      try {
        await updateVisitorActivity(visitor.id);
      } catch (error) {
        console.error('Error updating visitor activity:', error);
      }
    }
  };

  // Debug logging for visitor state
  useEffect(() => {
    console.log('Visitor context state changed:', { visitor, isFirstTime, galleryId });
  }, [visitor, isFirstTime, galleryId]);

  const value = {
    visitor,
    isFirstTime,
    registerVisitor,
    updateActivity,
  };

  return (
    <VisitorContext.Provider value={value}>
      {children}
    </VisitorContext.Provider>
  );
};
