import { z } from "zod";

// User Schema (for legacy server storage interface)
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });

// Gallery Schema
export const gallerySchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerEmail: z.string(),
  theme: z.enum(['wedding', 'birthday', 'vacation', 'custom']),
  customTheme: z.string().optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  isLive: z.boolean().default(true),
  createdAt: z.date(),
  spotifyConfig: z.object({
    accessToken: z.string().optional(),
    playlistId: z.string().optional(),
  }).optional(),
});

export const insertGallerySchema = gallerySchema.omit({ id: true, createdAt: true });

// Visitor Schema
export const visitorSchema = z.object({
  id: z.string(),
  galleryId: z.string(),
  name: z.string(),
  deviceId: z.string(),
  fingerprint: z.string(),
  createdAt: z.date(),
  lastActive: z.date(),
});

export const insertVisitorSchema = visitorSchema.omit({ id: true, createdAt: true, lastActive: true });

// Media Schema
export const mediaSchema = z.object({
  id: z.string(),
  galleryId: z.string(),
  visitorId: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  type: z.enum(['photo', 'video', 'story']),
  caption: z.string().optional(),
  createdAt: z.date(),
  expiresAt: z.date().optional(), // For stories
});

export const insertMediaSchema = mediaSchema.omit({ id: true, createdAt: true });

// Comment Schema
export const commentSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  galleryId: z.string(),
  visitorId: z.string(),
  text: z.string(),
  createdAt: z.date(),
});

export const insertCommentSchema = commentSchema.omit({ id: true, createdAt: true });

// Like Schema
export const likeSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  galleryId: z.string(),
  visitorId: z.string(),
  createdAt: z.date(),
});

export const insertLikeSchema = likeSchema.omit({ id: true, createdAt: true });

// Music Request Schema
export const musicRequestSchema = z.object({
  id: z.string(),
  galleryId: z.string(),
  visitorId: z.string(),
  spotifyTrackId: z.string(),
  trackName: z.string(),
  artistName: z.string(),
  albumCover: z.string().optional(),
  approved: z.boolean().default(false),
  createdAt: z.date(),
});

export const insertMusicRequestSchema = musicRequestSchema.omit({ id: true, createdAt: true });

// Timeline Entry Schema
export const timelineEntrySchema = z.object({
  id: z.string(),
  galleryId: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  image: z.string().optional(),
  order: z.number(),
  createdAt: z.date(),
});

export const insertTimelineEntrySchema = timelineEntrySchema.omit({ id: true, createdAt: true });

// Type exports
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Gallery = z.infer<typeof gallerySchema>;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Visitor = z.infer<typeof visitorSchema>;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Like = z.infer<typeof likeSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type MusicRequest = z.infer<typeof musicRequestSchema>;
export type InsertMusicRequest = z.infer<typeof insertMusicRequestSchema>;
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;
export type InsertTimelineEntry = z.infer<typeof insertTimelineEntrySchema>;

// Legacy table export for server compatibility
export const users = userSchema;
