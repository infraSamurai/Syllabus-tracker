// NOTE: Make sure to install 'exceljs' and 'json2csv' and their types for this controller to work.
import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import Topic from '../models/Topic';
import KPI from '../models/KPI';
import Progress from '../models/Progress';
import ProgressHistory from '../models/ProgressHistory';
// ProgressHistory is only used for JSON export, not for the progress export sheet

export class ExportController {
  async exportToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, filters } = req.body;
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Syllabus Tracker Pro';
      workbook.created = new Date();
      
      // Add subjects sheet
      const subjectSheet = workbook.addWorksheet('Subjects');
      const subjects = await Subject.find(filters?.subjects || {})
        .populate('class')
        .populate('chapters');
      
      subjectSheet.columns = [
        { header: 'Subject Name', key: 'name', width: 30 },
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Class', key: 'className', width: 15 },
        { header: 'Total Chapters', key: 'totalChapters', width: 15 },
        { header: 'Deadline', key: 'deadline', width: 15 }
      ];
      
      subjects.forEach(subject => {
        subjectSheet.addRow({
          name: subject.name,
          code: subject.code,
          department: subject.department,
          className: (subject.class as any)?.name || 'N/A',
          totalChapters: subject.chapters.length,
          deadline: subject.deadline
        });
      });
      
      // Add KPIs sheet
      const kpiSheet = workbook.addWorksheet('KPIs');
      const kpis = await KPI.find(filters?.kpis || {})
        .populate('subject', 'name code');
      
      kpiSheet.columns = [
        { header: 'Subject', key: 'subject', width: 30 },
        { header: 'KPI Title', key: 'title', width: 40 },
        { header: 'Target', key: 'target', width: 15 },
        { header: 'Current Value', key: 'currentValue', width: 15 },
        { header: 'Progress %', key: 'progress', width: 15 },
        { header: 'Achieved', key: 'achieved', width: 15 },
        { header: 'Priority', key: 'priority', width: 15 }
      ];
      
      kpis.forEach(kpi => {
        kpiSheet.addRow({
          subject: (kpi.subject as any)?.name || 'N/A',
          title: kpi.title,
          target: kpi.target,
          currentValue: kpi.currentValue,
          progress: ((kpi.currentValue / kpi.target) * 100).toFixed(2) + '%',
          achieved: kpi.achieved ? 'Yes' : 'No',
          priority: kpi.priority
        });
      });
      
      // Add progress sheet (use Progress model, not ProgressHistory)
      const progressSheet = workbook.addWorksheet('Progress');
      const progressData = await Progress.find()
        .populate('subject', 'name code')
        .populate('teacher', 'name');
      
      progressSheet.columns = [
        { header: 'Subject', key: 'subject', width: 30 },
        { header: 'Teacher', key: 'teacher', width: 25 },
        { header: 'Progress %', key: 'progress', width: 15 },
        { header: 'Topics Completed', key: 'topicsCompleted', width: 20 },
        { header: 'Total Topics', key: 'totalTopics', width: 15 },
        { header: 'On Track', key: 'onTrack', width: 15 }
      ];
      
      progressData.forEach(progress => {
        progressSheet.addRow({
          subject: (progress.subject as any)?.name || 'N/A',
          teacher: (progress.teacher as any)?.name || 'N/A',
          progress: progress.percentageComplete.toFixed(2) + '%',
          topicsCompleted: progress.completedTopics,
          totalTopics: progress.totalTopics,
          onTrack: progress.isOnTrack ? 'Yes' : 'No'
        });
      });
      
      // Style the headers
      [subjectSheet, kpiSheet, progressSheet].forEach(sheet => {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=syllabus-tracker-export.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  async exportToCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataType } = req.query;
      let data: any[] = [];
      let fields: string[] = [];
      
      switch (dataType) {
        case 'subjects':
          const subjects = await Subject.find()
            .populate('class')
            .lean();
          data = subjects.map(s => ({
            name: s.name,
            code: s.code,
            department: s.department,
            class: (s.class as any)?.name || 'N/A',
            deadline: s.deadline
          }));
          fields = ['name', 'code', 'department', 'class', 'deadline'];
          break;
          
        case 'kpis':
          const kpis = await KPI.find()
            .populate('subject', 'name')
            .lean();
          data = kpis.map(k => ({
            subject: (k.subject as any)?.name || 'N/A',
            title: k.title,
            target: k.target,
            currentValue: k.currentValue,
            achieved: k.achieved,
            priority: k.priority
          }));
          fields = ['subject', 'title', 'target', 'currentValue', 'achieved', 'priority'];
          break;
          
        default:
          return res.status(400).json({ message: 'Invalid data type' });
      }
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}-export.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async exportToJSON(req: Request, res: Response, next: NextFunction) {
    try {
      const subjects = await Subject.find()
        .populate('class')
        .populate({
          path: 'chapters',
          populate: { path: 'topics' }
        })
        .lean();
      
      const kpis = await KPI.find().lean();
      const progress = await Progress.find().lean();
      const progressHistory = await ProgressHistory.find()
        .sort({ date: -1 })
        .limit(1000)
        .lean();
      
      const exportData = {
        exportDate: new Date(),
        version: '1.0',
        data: {
          subjects,
          kpis,
          progress,
          progressHistory
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=syllabus-tracker-export.json');
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  }
} 