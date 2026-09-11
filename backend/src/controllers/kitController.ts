import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { KitModel } from '../models/Kit.js';
import { KitCoordinator } from '../services/kits/kitCoordinator.js';
import { z } from 'zod';

const createKitSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  companyUrl: z.string().url('A valid company URL is required'),
  daysAvailable: z.number().int().min(1).max(60)
});

export class KitController {
  static async createKit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const parsed = createKitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors.map(e => e.message).join(', ')
          }
        });
      }

      const { jobDescription, companyUrl, daysAvailable } = parsed.data;

      // Create initial Kit document in 'queued' state
      const kitDoc = await KitModel.create({
        userId: req.user.id,
        jobDescription,
        companyUrl,
        daysAvailable,
        status: 'queued',
        stepMessage: 'Starting generation pipeline...',
        progressPercent: 5
      });

      // Execute generation pipeline asynchronously or synchronously based on environment
      // Run pipeline in background updating kitDoc status in DB
      KitCoordinator.generateKit(
        jobDescription,
        companyUrl,
        daysAvailable,
        async (status, stepMessage, progressPercent) => {
          await KitModel.findByIdAndUpdate(kitDoc._id, {
            status: status as any,
            stepMessage,
            progressPercent
          });
        }
      )
        .then(async (kitData) => {
          await KitModel.findByIdAndUpdate(kitDoc._id, {
            status: 'completed',
            stepMessage: 'Kit generation complete!',
            progressPercent: 100,
            data: kitData
          });
        })
        .catch(async (err) => {
          await KitModel.findByIdAndUpdate(kitDoc._id, {
            status: 'failed',
            stepMessage: `Generation failed: ${err.message}`,
            progressPercent: 0,
            error: {
              code: err.code || 'GENERATION_ERROR',
              message: err.message
            }
          });
        });

      return res.status(202).json({
        id: kitDoc._id.toString(),
        status: kitDoc.status,
        stepMessage: kitDoc.stepMessage,
        progressPercent: kitDoc.progressPercent
      });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async getUserKits(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const kits = await KitModel.find({ userId: req.user.id }).sort({ createdAt: -1 });

      const responseKits = kits.map(k => ({
        id: k._id.toString(),
        company: k.data?.source?.company || k.companyUrl,
        role: k.data?.source?.role || 'Role',
        daysAvailable: k.daysAvailable,
        status: k.status,
        stepMessage: k.stepMessage,
        progressPercent: k.progressPercent,
        coveragePercent: k.data?.coverage ? Math.round(((k.data.role.requirements.filter(r => r.priority === 'must').length - k.data.coverage.uncovered_requirement_ids.length) / Math.max(1, k.data.role.requirements.filter(r => r.priority === 'must').length)) * 100) : 0,
        createdAt: k.createdAt
      }));

      return res.status(200).json({ kits: responseKits });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async getKitById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const kit = await KitModel.findOne({ _id: req.params.id, userId: req.user.id });
      if (!kit) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Interview kit not found.' } });
      }

      return res.status(200).json({
        id: kit._id.toString(),
        status: kit.status,
        stepMessage: kit.stepMessage,
        progressPercent: kit.progressPercent,
        error: kit.error,
        data: kit.data,
        createdAt: kit.createdAt
      });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async updateKitData(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const kit = await KitModel.findOne({ _id: req.params.id, userId: req.user.id });
      if (!kit) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Kit not found.' } });
      }

      kit.data = req.body.data;
      await kit.save();

      return res.status(200).json({ status: 'ok', data: kit.data });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async regenerateSection(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const kit = await KitModel.findOne({ _id: req.params.id, userId: req.user.id });
      if (!kit || !kit.data) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Kit not found or not yet completed.' } });
      }

      const { category } = req.body; // e.g. "technical" | "behavioural" | "system-design" | "company-fit"
      const updatedKitData = await KitCoordinator.regenerateCategory(kit.data, category);

      kit.data = updatedKitData;
      await kit.save();

      return res.status(200).json({ status: 'ok', data: kit.data });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async updateFlashcardConfidence(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const { flashcardId, confidence } = req.body;
      const kit = await KitModel.findOne({ _id: req.params.id, userId: req.user.id });
      if (!kit || !kit.data) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Kit not found.' } });
      }

      const fc = kit.data.flashcards.find(f => f.id === flashcardId);
      if (fc) {
        fc.confidence = Math.max(1, Math.min(5, confidence));
        fc.lastPracticedAt = new Date().toISOString();
        kit.markModified('data');
        await kit.save();
      }

      return res.status(200).json({ status: 'ok', flashcards: kit.data.flashcards });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteKit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

      const kit = await KitModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      if (!kit) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Kit not found.' } });
      }

      return res.status(200).json({ status: 'ok', message: 'Kit deleted.' });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}
