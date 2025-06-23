import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Visitor } from '@shared/schema';
import { createVisitor, findVisitorByDevice, updateVisitorActivity } from '@/lib/storage';

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

  useEffect(() => {
    if (!galleryId) return;

    const initializeVisitor = async () => {
      const deviceId = localStorage.getItem(`weddingpix_device_${galleryId}`) || uuidv4();
      localStorage.setItem(`weddingpix_device_${galleryId}`, deviceId);

      try {
        const existingVisitor = await findVisitorByDevice(galleryId, deviceId);
        if (existingVisitor) {
          setVisitor(existingVisitor);
          setIsFirstTime(false);
          // Update last active
          await updateVisitorActivity(galleryId, existingVisitor.id);
        } else {
          setIsFirstTime(true);
        }
      } catch (error) {
        console.error('Error initializing visitor:', error);
        setIsFirstTime(true);
      }
    };

    initializeVisitor();
  }, [galleryId]);

  const registerVisitor = async (galleryId: string, name: string) => {
    try {
      const deviceId = localStorage.getItem(`weddingpix_device_${galleryId}`) || uuidv4();
      const fingerprint = generateDeviceFingerprint();
      
      console.log('Registering visitor:', { galleryId, name, deviceId });
      
      const visitorId = await createVisitor({
        galleryId,
        name,
        deviceId,
        fingerprint,
      });

      const newVisitor: Visitor = {
        id: visitorId,
        galleryId,
        name,
        deviceId,
        fingerprint,
        createdAt: new Date(),
        lastActive: new Date(),
      };
      
      console.log('Visitor registered successfully:', newVisitor);

      setVisitor(newVisitor);
      setIsFirstTime(false);
      
      localStorage.setItem(`weddingpix_visitor_${galleryId}`, JSON.stringify(newVisitor));
      
      // Force a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error registering visitor:', error);
      throw error;
    }
  };

  const updateActivity = async () => {
    if (visitor && galleryId) {
      try {
        await updateVisitorActivity(galleryId, visitor.id);
      } catch (error) {
        console.error('Error updating visitor activity:', error);
      }
    }
  };

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
