import { storage as firebaseStorage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type {
  Gallery,
  InsertGallery,
  Visitor,
  InsertVisitor,
  Media,
  InsertMedia,
  Comment,
  InsertComment,
  Like,
  InsertLike,
  MusicRequest,
  InsertMusicRequest,
  TimelineEntry,
  InsertTimelineEntry,
} from '@shared/schema';

const API_BASE = '/api';

// Gallery operations
export const getGallery = async (galleryId: string): Promise<Gallery | null> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch gallery');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return null;
  }
};

// Visitor operations
export const registerVisitor = async (galleryId: string, name: string, deviceId: string, fingerprint: string): Promise<Visitor> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}/visitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        deviceId,
        fingerprint,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register visitor');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering visitor:', error);
    throw error;
  }
};

export const findVisitorByDevice = async (galleryId: string, deviceId: string, fingerprint: string): Promise<Visitor | null> => {
  try {
    const visitor = await registerVisitor(galleryId, '', deviceId, fingerprint);
    return visitor;
  } catch (error) {
    return null;
  }
};

export const updateVisitorActivity = async (visitorId: string): Promise<Visitor> => {
  // For now, just return a mock visitor since the API handles this internally
  return { id: visitorId } as Visitor;
};

// File upload (still uses Firebase Storage)
export const uploadFile = async (file: File, galleryId: string, type: 'photo' | 'video' | 'story' | 'profile'): Promise<string> => {
  try {
    console.log('Starting file upload:', { fileName: file.name, galleryId, type, fileSize: file.size });
    
    const fileId = uuidv4();
    const fileRef = ref(firebaseStorage, `galleries/${galleryId}/${type}s/${fileId}`);
    
    console.log('Uploading to path:', `galleries/${galleryId}/${type}s/${fileId}`);
    
    await uploadBytes(fileRef, file);
    console.log('File upload completed, getting download URL...');
    
    const downloadURL = await getDownloadURL(fileRef);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

// Media operations
export const createMedia = async (mediaData: InsertMedia): Promise<Media> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${mediaData.galleryId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: mediaData.authorId,
        url: mediaData.url,
        thumbnailUrl: mediaData.thumbnailUrl,
        type: mediaData.type,
        caption: mediaData.caption,
        expiresAt: mediaData.expiresAt,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create media');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating media:', error);
    throw error;
  }
};

export const getMedia = async (galleryId: string): Promise<Media[]> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}/media`);
    if (!response.ok) {
      throw new Error('Failed to fetch media');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching media:', error);
    return [];
  }
};

export const getStories = async (galleryId: string): Promise<Media[]> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}/stories`);
    if (!response.ok) {
      throw new Error('Failed to fetch stories');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
};

export const deleteMedia = async (mediaId: string, visitorId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitorId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete media');
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

// Comment operations
export const getComments = async (mediaId: string): Promise<Comment[]> => {
  try {
    const response = await fetch(`${API_BASE}/media/${mediaId}/comments`);
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const createComment = async (commentData: InsertComment): Promise<Comment> => {
  try {
    const response = await fetch(`${API_BASE}/media/${commentData.mediaId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: commentData.authorId,
        galleryId: '', // Will be filled by the server
        text: commentData.content,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string, visitorId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitorId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Like operations
export const createLike = async (likeData: InsertLike): Promise<Like> => {
  try {
    const response = await fetch(`${API_BASE}/media/${likeData.mediaId}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: likeData.visitorId,
        galleryId: '', // Will be filled by the server
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create like');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating like:', error);
    throw error;
  }
};

export const deleteLike = async (mediaId: string, visitorId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/media/${mediaId}/likes`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitorId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete like');
    }
  } catch (error) {
    console.error('Error deleting like:', error);
    throw error;
  }
};

export const createGallery = async (galleryData: InsertGallery & { id?: string }): Promise<Gallery> => {
  try {
    const response = await fetch(`${API_BASE}/galleries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(galleryData),
    });

    if (!response.ok) {
      throw new Error('Failed to create gallery');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating gallery:', error);
    throw error;
  }
};

export const createVisitor = async (visitorData: InsertVisitor): Promise<string> => {
  // Legacy function - now uses API
  const visitor = await registerVisitor(
    visitorData.galleryId, 
    visitorData.name, 
    visitorData.deviceId, 
    visitorData.fingerprint
  );
  return visitor.id;
};

export const getVisitor = async (galleryId: string, visitorId: string): Promise<Visitor | null> => {
  // For now return null since we don't need individual visitor lookup
  return null;
};

export const updateGallery = async (galleryId: string, updates: Partial<Gallery>): Promise<Gallery> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update gallery');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating gallery:', error);
    throw error;
  }
};

export const getMusicRequests = async (galleryId: string): Promise<MusicRequest[]> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}/music-requests`);
    
    if (!response.ok) {
      throw new Error('Failed to get music requests');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting music requests:', error);
    throw error;
  }
};

export const approveMusicRequest = async (galleryId: string, requestId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}/music-requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to approve music request');
    }
  } catch (error) {
    console.error('Error approving music request:', error);
    throw error;
  }
};

export const getLikes = async (galleryId: string, mediaId: string): Promise<Like[]> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${galleryId}/media/${mediaId}/likes`);
    
    if (!response.ok) {
      throw new Error('Failed to get likes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting likes:', error);
    throw error;
  }
};

export const subscribeToGalleryMedia = (galleryId: string, callback: (media: Media[]) => void) => {
  // For API-based approach, we'll use polling instead of real-time subscription
  // This is a simplified implementation - in production you might want WebSocket or SSE
  const pollMedia = async () => {
    try {
      const media = await getMedia(galleryId);
      callback(media);
    } catch (error) {
      console.error('Error polling media:', error);
    }
  };

  // Initial fetch
  pollMedia();

  // Poll every 5 seconds
  const interval = setInterval(pollMedia, 5000);

  // Return unsubscribe function
  return () => clearInterval(interval);
};

export const toggleLike = async (galleryId: string, mediaId: string, visitorId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/media/${mediaId}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitorId }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }

    const result = await response.json();
    return result.liked;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

export const createMusicRequest = async (requestData: InsertMusicRequest): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/galleries/${requestData.galleryId}/music-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Failed to create music request');
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error creating music request:', error);
    throw error;
  }
};