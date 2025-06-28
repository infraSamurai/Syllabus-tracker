import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';

const router = Router();
const exportController = new ExportController();

router.post('/excel', exportController.exportToExcel.bind(exportController));
router.get('/csv', exportController.exportToCSV.bind(exportController));
router.get('/json', exportController.exportToJSON.bind(exportController));

export default router; 