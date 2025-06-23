import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
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
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Gallery Routes
  app.post('/api/galleries', async (req, res) => {
    try {
      const galleryData: InsertGallery & { id?: string } = req.body;
      
      if (!galleryData.name || !galleryData.ownerEmail) {
        return res.status(400).json({ error: 'Name and ownerEmail are required' });
      }

      const gallery = await storage.createGallery(galleryData);
      res.status(201).json(gallery);
    } catch (error) {
      console.error('Error creating gallery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/galleries/:galleryId', async (req, res) => {
    try {
      const { galleryId } = req.params;
      const gallery = await storage.getGallery(galleryId);
      
      if (!gallery) {
        return res.status(404).json({ error: 'Gallery not found' });
      }
      
      res.json(gallery);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/galleries/:galleryId', async (req, res) => {
    try {
      const { galleryId } = req.params;
      const updates = req.body;
      
      const existingGallery = await storage.getGallery(galleryId);
      if (!existingGallery) {
        return res.status(404).json({ error: 'Gallery not found' });
      }

      const updatedGallery = await storage.updateGallery(galleryId, updates);
      res.json(updatedGallery);
    } catch (error) {
      console.error('Error updating gallery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Visitor Registration
  app.post('/api/galleries/:galleryId/visitors', async (req, res) => {
    try {
      const { galleryId } = req.params;
      const { name, deviceId, fingerprint } = req.body;

      if (!name || !deviceId || !fingerprint) {
        return res.status(400).json({ error: 'Name, deviceId, and fingerprint are required' });
      }

      // Check if visitor already exists
      const existingVisitor = await storage.findVisitorByDevice(galleryId, deviceId, fingerprint);
      if (existingVisitor) {
        // Update last active
        const updatedVisitor = await storage.updateVisitorActivity(existingVisitor.id);
        return res.json(updatedVisitor);
      }

      // Create new visitor
      const visitorData: InsertVisitor = {
        galleryId,
        name,
        deviceId,
        fingerprint,
      };

      const visitor = await storage.createVisitor(visitorData);
      res.status(201).json(visitor);
    } catch (error) {
      console.error('Error registering visitor:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Media Routes
  app.get('/api/galleries/:galleryId/media', async (req, res) => {
    try {
      const { galleryId } = req.params;
      const { type } = req.query;
      
      const media = await storage.getMediaByGallery(galleryId, type as string);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/galleries/:galleryId/media', async (req, res) => {
    try {
      const { galleryId } = req.params;
      const { visitorId, url, thumbnailUrl, type, caption } = req.body;

      if (!visitorId || !url || !type) {
        return res.status(400).json({ error: 'VisitorId, url, and type are required' });
      }

      const mediaData: InsertMedia = {
        galleryId,
        authorId: visitorId,
        url,
        thumbnailUrl,
        type,
        caption,
        expiresAt: type === 'story' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined, // 24h for stories
      };

      const media = await storage.createMedia(mediaData);
      res.status(201).json(media);
    } catch (error) {
      console.error('Error creating media:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/media/:mediaId', async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { visitorId } = req.body;

      if (!visitorId) {
        return res.status(400).json({ error: 'VisitorId is required' });
      }

      // Check if visitor owns this media
      const media = await storage.getMedia(mediaId);
      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      if (media.visitorId !== visitorId) {
        return res.status(403).json({ error: 'You can only delete your own content' });
      }

      await storage.deleteMedia(mediaId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Like Routes
  app.post('/api/media/:mediaId/likes', async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { visitorId, galleryId } = req.body;

      if (!visitorId || !galleryId) {
        return res.status(400).json({ error: 'VisitorId and galleryId are required' });
      }

      // Check if already liked
      const existingLike = await storage.findLike(mediaId, visitorId);
      if (existingLike) {
        return res.status(400).json({ error: 'Already liked' });
      }

      const likeData: InsertLike = {
        mediaId,
        visitorId,
      };

      const like = await storage.createLike(likeData);
      res.status(201).json(like);
    } catch (error) {
      console.error('Error creating like:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/media/:mediaId/likes', async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { visitorId } = req.body;

      if (!visitorId) {
        return res.status(400).json({ error: 'VisitorId is required' });
      }

      await storage.deleteLike(mediaId, visitorId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting like:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Comment Routes
  app.get('/api/media/:mediaId/comments', async (req, res) => {
    try {
      const { mediaId } = req.params;
      const comments = await storage.getCommentsByMedia(mediaId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/media/:mediaId/comments', async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { visitorId, galleryId, text } = req.body;

      if (!visitorId || !galleryId || !text) {
        return res.status(400).json({ error: 'VisitorId, galleryId, and text are required' });
      }

      const commentData: InsertComment = {
        mediaId,
        authorId: visitorId,
        content: text,
      };

      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/comments/:commentId', async (req, res) => {
    try {
      const { commentId } = req.params;
      const { visitorId } = req.body;

      if (!visitorId) {
        return res.status(400).json({ error: 'VisitorId is required' });
      }

      // Check if visitor owns this comment
      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.visitorId !== visitorId) {
        return res.status(403).json({ error: 'You can only delete your own comments' });
      }

      await storage.deleteComment(commentId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get stories (auto-expire after 24h)
  app.get('/api/galleries/:galleryId/stories', async (req, res) => {
    try {
      const { galleryId } = req.params;
      const stories = await storage.getActiveStories(galleryId);
      res.json(stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
