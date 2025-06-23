import { 
  users, 
  type User, 
  type InsertUser,
  type Gallery,
  type InsertGallery,
  type Visitor,
  type InsertVisitor,
  type Media,
  type InsertMedia,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Gallery methods
  getGallery(id: string): Promise<Gallery | undefined>;
  createGallery(gallery: InsertGallery & { id?: string }): Promise<Gallery>;
  updateGallery(id: string, updates: Partial<Gallery>): Promise<Gallery>;
  
  // Visitor methods
  findVisitorByDevice(galleryId: string, deviceId: string, fingerprint: string): Promise<Visitor | undefined>;
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  updateVisitorActivity(visitorId: string): Promise<Visitor>;
  
  // Media methods
  getMedia(id: string): Promise<Media | undefined>;
  getMediaByGallery(galleryId: string, type?: string): Promise<Media[]>;
  createMedia(media: InsertMedia): Promise<Media>;
  deleteMedia(id: string): Promise<void>;
  getActiveStories(galleryId: string): Promise<Media[]>;
  
  // Comment methods
  getComment(id: string): Promise<Comment | undefined>;
  getCommentsByMedia(mediaId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  
  // Like methods
  findLike(mediaId: string, visitorId: string): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(mediaId: string, visitorId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private galleries: Map<string, Gallery>;
  private visitors: Map<string, Visitor>;
  private media: Map<string, Media>;
  private comments: Map<string, Comment>;
  private likes: Map<string, Like>;
  private currentUserId: number;

  constructor() {
    this.users = new Map();
    this.galleries = new Map();
    this.visitors = new Map();
    this.media = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.currentUserId = 1;
    
    // Add sample gallery for testing
    this.addSampleData();
  }

  private addSampleData() {
    const sampleGallery: Gallery = {
      id: "sample-wedding-2024",
      name: "Anna & Max Hochzeit",
      ownerEmail: "anna@example.com",
      theme: "wedding",
      profileImage: "",
      bio: "Willkommen zu unserer Hochzeit! Teilt eure schönsten Momente mit uns.",
      isLive: true,
      createdAt: new Date(),
    };
    this.galleries.set(sampleGallery.id, sampleGallery);

    // Add the specific galleries that the frontend is trying to access
    const testGalleries: Gallery[] = [
      {
        id: "gallery_1750698174963_peuob45wp",
        name: "Wedding Gallery",
        ownerEmail: "test@example.com",
        theme: "wedding",
        profileImage: "",
        bio: "Share your beautiful moments with us!",
        isLive: true,
        createdAt: new Date(),
      },
      {
        id: "gallery_1750698416295_8oa17yn3q",
        name: "Wedding Gallery 2",
        ownerEmail: "test2@example.com",
        theme: "wedding",
        profileImage: "",
        bio: "Share your beautiful moments with us!",
        isLive: true,
        createdAt: new Date(),
      }
    ];
    
    testGalleries.forEach(gallery => {
      this.galleries.set(gallery.id, gallery);
    });

    // Add sample media data
    this.addSampleMedia();
  }

  private addSampleMedia() {
    const galleryIds = ["gallery_1750698174963_peuob45wp", "gallery_1750698416295_8oa17yn3q"];
    
    galleryIds.forEach((galleryId, index) => {
      this.addMediaForGallery(galleryId, index);
    });
  }

  private addMediaForGallery(galleryId: string, index: number) {
    
    // Add sample photos
    const samplePhotos: Media[] = [
      {
        id: `media_${index}_1`,
        galleryId,
        url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
        type: "photo",
        caption: "Beautiful moment captured!",
        authorId: `visitor_${index}_1`,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: `media_${index}_2`, 
        galleryId,
        url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
        type: "photo",
        caption: "Amazing celebration",
        authorId: `visitor_${index}_2`,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        id: `media_${index}_3`,
        galleryId,
        url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", 
        type: "photo",
        caption: "Perfect day!",
        authorId: `visitor_${index}_3`,
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
      }
    ];

    // Add sample stories  
    const sampleStories: Media[] = [
      {
        id: `story_${index}_1`,
        galleryId,
        url: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400",
        type: "story", 
        caption: "Behind the scenes",
        authorId: `visitor_${index}_1`,
        createdAt: new Date(Date.now() - 1800000), // 30 min ago
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      },
      {
        id: `story_${index}_2`,
        galleryId, 
        url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400",
        type: "story",
        caption: "Getting ready",
        authorId: `visitor_${index}_2`, 
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        expiresAt: new Date(Date.now() + 82800000), // 23 hours from now
      }
    ];

    // Store all media
    [...samplePhotos, ...sampleStories].forEach(media => {
      this.media.set(media.id, media);
    });

    // Add sample visitors
    const sampleVisitors: Visitor[] = [
      {
        id: `visitor_${index}_1`,
        galleryId,
        name: "Anna Schmidt",
        deviceId: `device_${index}_1`,
        fingerprint: `fp_${index}_1`,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        lastActive: new Date(),
      },
      {
        id: `visitor_${index}_2`, 
        galleryId,
        name: "Max Mueller",
        deviceId: `device_${index}_2`,
        fingerprint: `fp_${index}_2`, 
        createdAt: new Date(Date.now() - 43200000), // 12 hours ago
        lastActive: new Date(),
      },
      {
        id: `visitor_${index}_3`,
        galleryId,
        name: "Lisa Weber", 
        deviceId: `device_${index}_3`,
        fingerprint: `fp_${index}_3`,
        createdAt: new Date(Date.now() - 21600000), // 6 hours ago
        lastActive: new Date(),
      }
    ];

    sampleVisitors.forEach(visitor => {
      this.visitors.set(visitor.id, visitor);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Gallery methods
  async getGallery(id: string): Promise<Gallery | undefined> {
    return this.galleries.get(id);
  }

  async createGallery(insertGallery: InsertGallery & { id?: string }): Promise<Gallery> {
    const id = insertGallery.id || uuidv4();
    const gallery: Gallery = { 
      ...insertGallery, 
      id, 
      createdAt: new Date(),
      isLive: true 
    };
    this.galleries.set(id, gallery);
    return gallery;
  }

  async updateGallery(id: string, updates: Partial<Gallery>): Promise<Gallery> {
    const existingGallery = this.galleries.get(id);
    if (!existingGallery) {
      throw new Error('Gallery not found');
    }
    
    const updatedGallery: Gallery = {
      ...existingGallery,
      ...updates,
      id, // Ensure ID cannot be changed
      createdAt: existingGallery.createdAt // Preserve creation date
    };
    
    this.galleries.set(id, updatedGallery);
    return updatedGallery;
  }

  // Visitor methods
  async findVisitorByDevice(galleryId: string, deviceId: string, fingerprint: string): Promise<Visitor | undefined> {
    return Array.from(this.visitors.values()).find(
      (visitor) => visitor.galleryId === galleryId && 
                   visitor.deviceId === deviceId && 
                   visitor.fingerprint === fingerprint
    );
  }

  async createVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const id = uuidv4();
    const now = new Date();
    const visitor: Visitor = { 
      ...insertVisitor, 
      id, 
      createdAt: now,
      lastActive: now
    };
    this.visitors.set(id, visitor);
    return visitor;
  }

  async updateVisitorActivity(visitorId: string): Promise<Visitor> {
    const visitor = this.visitors.get(visitorId);
    if (!visitor) {
      throw new Error('Visitor not found');
    }
    
    visitor.lastActive = new Date();
    this.visitors.set(visitorId, visitor);
    return visitor;
  }

  // Media methods
  async getMedia(id: string): Promise<Media | undefined> {
    return this.media.get(id);
  }

  async getMediaByGallery(galleryId: string, type?: string): Promise<Media[]> {
    return Array.from(this.media.values())
      .filter(media => {
        const matchesGallery = media.galleryId === galleryId;
        const matchesType = !type || media.type === type;
        const notExpired = !media.expiresAt || media.expiresAt > new Date();
        return matchesGallery && matchesType && notExpired;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = uuidv4();
    const media: Media = { 
      ...insertMedia, 
      id, 
      createdAt: new Date()
    };
    this.media.set(id, media);
    return media;
  }

  async deleteMedia(id: string): Promise<void> {
    this.media.delete(id);
    // Also delete associated comments and likes
    Array.from(this.comments.entries())
      .filter(([, comment]) => comment.mediaId === id)
      .forEach(([commentId]) => this.comments.delete(commentId));
    
    Array.from(this.likes.entries())
      .filter(([, like]) => like.mediaId === id)
      .forEach(([likeId]) => this.likes.delete(likeId));
  }

  async getActiveStories(galleryId: string): Promise<Media[]> {
    const now = new Date();
    return Array.from(this.media.values())
      .filter(media => 
        media.galleryId === galleryId && 
        media.type === 'story' &&
        (!media.expiresAt || media.expiresAt > now)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Comment methods
  async getComment(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByMedia(mediaId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.mediaId === mediaId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = uuidv4();
    const comment: Comment = { 
      ...insertComment, 
      id, 
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id);
  }

  // Like methods
  async findLike(mediaId: string, visitorId: string): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.mediaId === mediaId && like.visitorId === visitorId
    );
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = uuidv4();
    const like: Like = { 
      ...insertLike, 
      id, 
      createdAt: new Date()
    };
    this.likes.set(id, like);
    return like;
  }

  async deleteLike(mediaId: string, visitorId: string): Promise<void> {
    const like = await this.findLike(mediaId, visitorId);
    if (like) {
      this.likes.delete(like.id);
    }
  }
}

export const storage = new MemStorage();
