import { db, storage } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
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

// Gallery operations
export const createGallery = async (galleryData: InsertGallery & { id: string }) => {
  try {
    const docRef = doc(db, 'galleries', galleryData.id);
    
    // Ensure all required fields are present and properly formatted
    const cleanGalleryData = {
      id: galleryData.id,
      name: galleryData.name || '',
      ownerEmail: galleryData.ownerEmail || '',
      theme: galleryData.theme || 'wedding',
      customTheme: galleryData.customTheme || null,
      profileImage: galleryData.profileImage || '',
      bio: galleryData.bio || '',
      isLive: galleryData.isLive !== undefined ? galleryData.isLive : true,
      createdAt: serverTimestamp(),
      spotifyConfig: galleryData.spotifyConfig || null,
    };
    
    await setDoc(docRef, cleanGalleryData);
    
    // Initialize subcollections to prevent failed-precondition errors
    const mediaColRef = collection(db, `galleries/${galleryData.id}/media`);
    const timelineColRef = collection(db, `galleries/${galleryData.id}/timeline`);
    
    // Add initial timeline entry to create the collection
    await addDoc(timelineColRef, {
      title: 'Gallery Created',
      description: `${galleryData.name} gallery was created`,
      timestamp: serverTimestamp(),
      type: 'milestone'
    });
    
    return galleryData.id;
  } catch (error) {
    console.error('Error creating gallery:', error);
    throw error;
  }
};

export const getGallery = async (galleryId: string): Promise<Gallery | null> => {
  const docRef = doc(db, 'galleries', galleryId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Gallery;
  }
  return null;
};

export const updateGallery = async (galleryId: string, updates: Partial<Gallery>) => {
  const docRef = doc(db, 'galleries', galleryId);
  await updateDoc(docRef, updates);
};

// Visitor operations
export const createVisitor = async (visitorData: InsertVisitor): Promise<string> => {
  try {
    console.log('Creating visitor in database:', visitorData);
    const colRef = collection(db, `galleries/${visitorData.galleryId}/visitors`);
    const docRef = await addDoc(colRef, {
      ...visitorData,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
    console.log('Visitor created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating visitor in database:', error);
    throw error;
  }
};

export const getVisitor = async (galleryId: string, visitorId: string): Promise<Visitor | null> => {
  const docRef = doc(db, `galleries/${galleryId}/visitors`, visitorId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastActive: data.lastActive?.toDate() || new Date(),
    } as Visitor;
  }
  return null;
};

export const findVisitorByDevice = async (galleryId: string, deviceId: string): Promise<Visitor | null> => {
  const colRef = collection(db, `galleries/${galleryId}/visitors`);
  const q = query(colRef, where('deviceId', '==', deviceId));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastActive: data.lastActive?.toDate() || new Date(),
    } as Visitor;
  }
  return null;
};

export const updateVisitorActivity = async (galleryId: string, visitorId: string) => {
  const docRef = doc(db, `galleries/${galleryId}/visitors`, visitorId);
  await updateDoc(docRef, {
    lastActive: serverTimestamp(),
  });
};

// Media operations
export const uploadFile = async (file: File, galleryId: string, type: 'photo' | 'video' | 'story' | 'profile'): Promise<string> => {
  try {
    console.log('Starting file upload:', { fileName: file.name, galleryId, type, fileSize: file.size });
    
    const fileId = uuidv4();
    const fileRef = ref(storage, `galleries/${galleryId}/${type}s/${fileId}`);
    
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

export const createMedia = async (mediaData: InsertMedia): Promise<string> => {
  try {
    const colRef = collection(db, `galleries/${mediaData.galleryId}/media`);
    
    // Ensure all required fields are present and properly typed
    const cleanMediaData = {
      galleryId: mediaData.galleryId,
      visitorId: mediaData.visitorId || 'owner',
      url: mediaData.url,
      type: mediaData.type,
      caption: mediaData.caption || null,
      thumbnailUrl: mediaData.thumbnailUrl || null,
      createdAt: serverTimestamp(),
      expiresAt: mediaData.type === 'story' 
        ? Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
        : null,
    };
    
    console.log('Creating media entry with data:', cleanMediaData);
    
    const docRef = await addDoc(colRef, cleanMediaData);
    console.log('Media entry created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating media entry:', error);
    throw error;
  }
};

export const getMedia = async (galleryId: string): Promise<Media[]> => {
  const colRef = collection(db, `galleries/${galleryId}/media`);
  const querySnapshot = await getDocs(colRef);
  
  // Filter out stories from the main gallery feed
  return querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || null,
      } as Media;
    })
    .filter(media => media.type !== 'story') // Exclude stories from main feed
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getStories = async (galleryId: string): Promise<Media[]> => {
  try {
    const colRef = collection(db, `galleries/${galleryId}/media`);
    
    // Get all media without complex queries to avoid index issues
    const querySnapshot = await getDocs(colRef);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const now = new Date();
    
    // Filter and process stories in memory
    const stories = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || null,
        } as Media;
      })
      .filter(media => {
        // Only return stories that are still active
        return media.type === 'story' && (!media.expiresAt || media.expiresAt > now);
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
    
    return stories;
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
};

export const deleteMedia = async (galleryId: string, mediaId: string, url: string) => {
  const docRef = doc(db, `galleries/${galleryId}/media`, mediaId);
  await deleteDoc(docRef);
  
  // Delete from storage
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
};

// Comment operations
export const createComment = async (commentData: InsertComment): Promise<string> => {
  const colRef = collection(db, `galleries/${commentData.galleryId}/comments`);
  const docRef = await addDoc(colRef, {
    ...commentData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getComments = async (galleryId: string, mediaId: string): Promise<Comment[]> => {
  const colRef = collection(db, `galleries/${galleryId}/comments`);
  const q = query(colRef, where('mediaId', '==', mediaId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Comment;
  }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Sort in memory
};

export const deleteComment = async (galleryId: string, commentId: string) => {
  const docRef = doc(db, `galleries/${galleryId}/comments`, commentId);
  await deleteDoc(docRef);
};

// Like operations
export const toggleLike = async (galleryId: string, mediaId: string, visitorId: string): Promise<boolean> => {
  const colRef = collection(db, `galleries/${galleryId}/likes`);
  const q = query(colRef, where('mediaId', '==', mediaId), where('visitorId', '==', visitorId));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Unlike
    const doc = querySnapshot.docs[0];
    await deleteDoc(doc.ref);
    return false;
  } else {
    // Like
    await addDoc(colRef, {
      mediaId,
      galleryId,
      visitorId,
      createdAt: serverTimestamp(),
    });
    return true;
  }
};

export const getLikes = async (galleryId: string, mediaId: string): Promise<Like[]> => {
  const colRef = collection(db, `galleries/${galleryId}/likes`);
  const q = query(colRef, where('mediaId', '==', mediaId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Like;
  });
};

// Music request operations
export const createMusicRequest = async (requestData: InsertMusicRequest): Promise<string> => {
  const colRef = collection(db, `galleries/${requestData.galleryId}/musicRequests`);
  const docRef = await addDoc(colRef, {
    ...requestData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getMusicRequests = async (galleryId: string): Promise<MusicRequest[]> => {
  const colRef = collection(db, `galleries/${galleryId}/musicRequests`);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as MusicRequest;
  });
};

export const approveMusicRequest = async (galleryId: string, requestId: string) => {
  const docRef = doc(db, `galleries/${galleryId}/musicRequests`, requestId);
  await updateDoc(docRef, { approved: true });
};

// Timeline operations
export const createTimelineEntry = async (entryData: InsertTimelineEntry): Promise<string> => {
  const colRef = collection(db, `galleries/${entryData.galleryId}/timeline`);
  const docRef = await addDoc(colRef, {
    ...entryData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getTimeline = async (galleryId: string): Promise<TimelineEntry[]> => {
  const colRef = collection(db, `galleries/${galleryId}/timeline`);
  const q = query(colRef, orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as TimelineEntry;
  });
};

// Real-time subscriptions
export const subscribeToGalleryMedia = (galleryId: string, callback: (media: Media[]) => void) => {
  const colRef = collection(db, `galleries/${galleryId}/media`);
  
  return onSnapshot(colRef, (querySnapshot) => {
    const media = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || null,
      } as Media;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort in memory instead
    
    callback(media);
  });
};

export const subscribeToComments = (galleryId: string, mediaId: string, callback: (comments: Comment[]) => void) => {
  const colRef = collection(db, `galleries/${galleryId}/comments`);
  const q = query(colRef, where('mediaId', '==', mediaId));
  
  return onSnapshot(q, (querySnapshot) => {
    const comments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Comment;
    });
    callback(comments);
  });
};
