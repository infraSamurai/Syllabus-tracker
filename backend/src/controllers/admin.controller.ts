import { Request, Response, NextFunction } from 'express';
import { Progress } from '../models/Progress';
import { Subject } from '../models/Subject';
import { User } from '../models/User';
import { Chapter } from '../models/Chapter';
import { Topic } from '../models/Topic';

export class AdminController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const totalSubjects = await Subject.countDocuments();
      const totalTeachers = await User.countDocuments({ role: 'teacher' });
      
      const progress = await Progress.aggregate([
        {
          $group: {
            _id: null,
            avgProgress: { $avg: '$percentageComplete' },
            totalBehind: { $sum: { $cond: [{ $eq: ['$isOnTrack', false] }, 1, 0] } }
          }
        }
      ]);

      res.json({
        totalSubjects,
        totalTeachers,
        averageProgress: progress[0]?.avgProgress || 0,
        subjectsBehind: progress[0]?.totalBehind || 0
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchoolWideProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progressData = await Progress.find()
        .populate('subject', 'name code grade department')
        .populate('teacher', 'name email')
        .sort({ percentageComplete: 1 });

      res.json(progressData);
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentProgress = await Progress.aggregate([
        {
          $lookup: {
            from: 'subjects',
            localField: 'subject',
            foreignField: '_id',
            as: 'subjectData'
          }
        },
        { $unwind: '$subjectData' },
        {
          $group: {
            _id: '$subjectData.department',
            avgProgress: { $avg: '$percentageComplete' },
            totalSubjects: { $sum: 1 },
            subjectsBehind: { $sum: { $cond: [{ $eq: ['$isOnTrack', false] }, 1, 0] } }
          }
        }
      ]);

      res.json(departmentProgress);
    } catch (error) {
      next(error);
    }
  }

  async generateComplianceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      
      const report = await Progress.aggregate([
        {
          $lookup: {
            from: 'subjects',
            localField: 'subject',
            foreignField: '_id',
            as: 'subjectData'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'teacher',
            foreignField: '_id',
            as: 'teacherData'
          }
        },
        { $unwind: '$subjectData' },
        { $unwind: '$teacherData' },
        {
          $project: {
            subjectName: '$subjectData.name',
            subjectCode: '$subjectData.code',
            grade: '$subjectData.grade',
            department: '$subjectData.department',
            teacherName: '$teacherData.name',
            percentageComplete: 1,
            isOnTrack: 1,
            lastUpdated: 1
          }
        }
      ]);

      res.json({
        generatedAt: new Date(),
        reportPeriod: { startDate, endDate },
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
}
