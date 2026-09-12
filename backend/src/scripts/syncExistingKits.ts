import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { KitModel } from '../models/Kit.js';
import { QuestionModel } from '../models/Question.js';
import { FlashcardModel } from '../models/Flashcard.js';
import { ScheduleModel } from '../models/Schedule.js';
import { CompanyBriefModel } from '../models/CompanyBrief.js';
import { RoleModel } from '../models/Role.js';

async function syncKitsToStandaloneCollections() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(config.mongoUri);
  console.log('Connected!');

  const kits = await KitModel.find({ status: 'completed' });
  console.log(`Found ${kits.length} completed kits to sync to standalone collections.`);

  for (const kit of kits) {
    if (!kit.data) continue;
    const kitId = kit._id;

    console.log(`Syncing Kit ID ${kitId} (${kit.data.source?.company || 'Company'})...`);

    // Clean existing
    await Promise.all([
      QuestionModel.deleteMany({ kitId }),
      FlashcardModel.deleteMany({ kitId }),
      ScheduleModel.deleteMany({ kitId }),
      CompanyBriefModel.deleteMany({ kitId }),
      RoleModel.deleteMany({ kitId })
    ]);

    const company = kit.data.source?.company || 'Company';
    const role = kit.data.source?.role || kit.data.role?.title || 'Role';

    // Questions
    if (Array.isArray(kit.data.questions) && kit.data.questions.length > 0) {
      await QuestionModel.insertMany(
        kit.data.questions.map((q: any) => ({
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

    // Flashcards
    if (Array.isArray(kit.data.flashcards) && kit.data.flashcards.length > 0) {
      await FlashcardModel.insertMany(
        kit.data.flashcards.map((f: any) => ({
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

    // Schedule
    if (kit.data.schedule) {
      await ScheduleModel.create({
        kitId,
        daysAvailable: kit.data.schedule.days_available,
        days: kit.data.schedule.days
      });
    }

    // CompanyBrief
    if (kit.data.company_brief) {
      await CompanyBriefModel.create({
        kitId,
        summary: kit.data.company_brief.summary,
        what_they_do: kit.data.company_brief.what_they_do,
        interview_process: kit.data.company_brief.interview_process,
        take_home_assignment: kit.data.company_brief.take_home_assignment,
        sources: kit.data.company_brief.sources
      });
    }

    // Role
    if (kit.data.role) {
      await RoleModel.create({
        kitId,
        title: kit.data.role.title,
        seniority: kit.data.role.seniority,
        responsibilities: kit.data.role.responsibilities,
        requirements: kit.data.role.requirements
      });
    }

    console.log(`Successfully synced Kit ID ${kitId}!`);
  }

  console.log('All existing kits synced successfully to standalone MongoDB collections!');
  await mongoose.disconnect();
  process.exit(0);
}

syncKitsToStandaloneCollections().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
