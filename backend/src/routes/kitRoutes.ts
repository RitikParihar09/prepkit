import { Router } from 'express';
import { KitController } from '../controllers/kitController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', KitController.createKit);
router.get('/', KitController.getUserKits);
router.get('/:id', KitController.getKitById);
router.patch('/:id', KitController.updateKitData);
router.delete('/:id', KitController.deleteKit);

router.post('/:id/regenerate', KitController.regenerateSection);
router.post('/:id/cancel', KitController.cancelKitGeneration);
router.patch('/:id/flashcards/confidence', KitController.updateFlashcardConfidence);

export default router;
