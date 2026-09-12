import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { KitModel } from '../models/Kit.js';
import { QuestionModel } from '../models/Question.js';
import { FlashcardModel } from '../models/Flashcard.js';
import { ScheduleModel } from '../models/Schedule.js';
import { CompanyBriefModel } from '../models/CompanyBrief.js';
import { RoleModel } from '../models/Role.js';
import { KitCoordinator } from '../services/kits/kitCoordinator.js';
import { z } from 'zod';

const createKitSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  companyUrl: z.string().url('A valid company URL is required'),
  daysAvailable: z.number().int().min(1).max(60),
  interviewNotes: z.string().optional()
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

      const { jobDescription, companyUrl, daysAvailable, interviewNotes } = parsed.data;

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
        interviewNotes,
        async (status, stepMessage, progressPercent, log, source) => {
          const updateObj: any = {
            status: status as any,
            stepMessage,
            progressPercent
          };

          const updateQuery: any = { $set: updateObj };
          if (log || source) {
            updateQuery.$push = {};
            if (log) updateQuery.$push.logs = log;
            if (source) updateQuery.$push.crawledSources = source;
          }

          await KitModel.findByIdAndUpdate(kitDoc._id, updateQuery);
        }
      )
        .then(async (kitData) => {
          await KitModel.findByIdAndUpdate(kitDoc._id, {
            status: 'completed',
            stepMessage: 'Kit generation complete!',
            progressPercent: 100,
            data: kitData
          });
          await saveKitSubModels(kitDoc._id, kitData);
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

      const responseKits = kits.map(k => {
        const scheduleDays = k.data?.schedule?.days || [];
        const completedDaysCount = scheduleDays.filter((d: any) => d.isCompleted).length;
        const totalDaysCount = scheduleDays.length || k.daysAvailable;

        return {
          id: k._id.toString(),
          company: k.data?.source?.company || k.companyUrl,
          role: k.data?.source?.role || 'Role',
          daysAvailable: k.daysAvailable,
          status: k.status,
          stepMessage: k.stepMessage,
          progressPercent: k.progressPercent,
          completedDaysCount,
          totalDaysCount,
          coveragePercent: k.data?.coverage ? Math.round(((k.data.role.requirements.filter((r: any) => r.priority === 'must').length - k.data.coverage.uncovered_requirement_ids.length) / Math.max(1, k.data.role.requirements.filter((r: any) => r.priority === 'must').length)) * 100) : 0,
          createdAt: k.createdAt
        };
      });

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
        companyUrl: kit.companyUrl,
        jobDescription: kit.jobDescription,
        daysAvailable: kit.daysAvailable,
        status: kit.status,
        stepMessage: kit.stepMessage,
        progressPercent: kit.progressPercent,
        logs: kit.logs || [],
        crawledSources: kit.crawledSources || [],
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
      kit.markModified('data');
      await kit.save();
      await saveKitSubModels(kit._id, kit.data);

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
      await saveKitSubModels(kit._id, kit.data);

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
        await saveKitSubModels(kit._id, kit.data);
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

      await Promise.all([
        QuestionModel.deleteMany({ kitId: kit._id }),
        FlashcardModel.deleteMany({ kitId: kit._id }),
        ScheduleModel.deleteMany({ kitId: kit._id }),
        CompanyBriefModel.deleteMany({ kitId: kit._id }),
        RoleModel.deleteMany({ kitId: kit._id })
      ]);

      return res.status(200).json({ status: 'ok', message: 'Kit deleted.' });
    } catch (error: any) {
      return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
}

/**
 * Persists sub-models into standalone MongoDB Atlas collections (questions, flashcards, schedules, company_briefs, roles)
 */
async function saveKitSubModels(kitId: any, kitData: any) {
  if (!kitData) return;
  try {
    // Clean up existing sub-documents for this kitId
    await Promise.all([
      QuestionModel.deleteMany({ kitId }),
      FlashcardModel.deleteMany({ kitId }),
      ScheduleModel.deleteMany({ kitId }),
      CompanyBriefModel.deleteMany({ kitId }),
      RoleModel.deleteMany({ kitId })
    ]);

    const company = kitData.source?.company || 'Company';
    const role = kitData.source?.role || kitData.role?.title || 'Role';

    // Save standalone Questions
    if (Array.isArray(kitData.questions) && kitData.questions.length > 0) {
      await QuestionModel.insertMany(
        kitData.questions.map((q: any) => ({
          kitId,
          company,
          role,
          questionId: q.id,
          requirement_ids: q.requirement_ids,
          category: q.category,
          prompt: q.prompt,
          answer_outline: q.answer_outline,
          difficulty: q.difficulty,
          _meta: q._meta
        }))
      );
    }

    // Save standalone Flashcards
    if (Array.isArray(kitData.flashcards) && kitData.flashcards.length > 0) {
      await FlashcardModel.insertMany(
        kitData.flashcards.map((f: any) => ({
          kitId,
          company,
          role,
          flashcardId: f.id,
          front: f.front,
          back: f.back,
          requirement_ids: f.requirement_ids,
          confidence: f.confidence,
          lastPracticedAt: f.lastPracticedAt,
          _meta: f._meta
        }))
      );
    }

    // Save standalone Schedule
    if (kitData.schedule) {
      await ScheduleModel.create({
        kitId,
        daysAvailable: kitData.schedule.days_available,
        days: kitData.schedule.days
      });
    }

    // Save standalone CompanyBrief
    if (kitData.company_brief) {
      await CompanyBriefModel.create({
        kitId,
        summary: kitData.company_brief.summary,
        what_they_do: kitData.company_brief.what_they_do,
        interview_process: kitData.company_brief.interview_process,
        take_home_assignment: kitData.company_brief.take_home_assignment,
        sources: kitData.company_brief.sources
      });
    }

    // Save standalone Role
    if (kitData.role) {
      await RoleModel.create({
        kitId,
        title: kitData.role.title,
        seniority: kitData.role.seniority,
        responsibilities: kitData.role.responsibilities,
        requirements: kitData.role.requirements
      });
    }
  } catch (err) {
    console.error('Error persisting kit sub-models to MongoDB Atlas collections:', err);
  }
}
