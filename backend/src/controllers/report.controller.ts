import { Request, Response, NextFunction } from 'express';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import Topic from '../models/Topic';
import { User } from '../models/User';
import { Progress } from '../models/Progress';

function getWeekRange(date = new Date()) {
  // Returns [startOfWeek, endOfWeek] (Monday to Sunday)
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diffToMonday));
  monday.setHours(0,0,0,0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);
  return [monday, sunday];
}

function getMonthRange(date = new Date()) {
  // Returns [startOfMonth, endOfMonth]
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return [start, end];
}

export class ReportController {
  async generateWeeklyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      
      // Default to current week if no dates specified
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date();
      
      // Set to start of week (Monday) and end of week (Sunday)
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      // Get topics covered in this week
      const topicsCovered = await Topic.countDocuments({
        completed: true,
        updatedAt: { $gte: start, $lte: end }
      });

      // Get total topics planned for this week
      const topicsPlanned = await Topic.countDocuments({
        deadline: { $gte: start, $lte: end }
      });

      // Class-wise completion status
      const classProgress = await Progress.aggregate([
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
          $lookup: {
            from: 'classes',
            localField: 'subjectData.class',
            foreignField: '_id',
            as: 'classData'
          }
        },
        { $unwind: '$classData' },
        {
          $group: {
            _id: '$classData._id',
            className: { $first: '$classData.name' },
            avgCompletion: { $avg: '$percentageComplete' }
          }
        }
      ]);

      const report = {
        generatedAt: new Date(),
        week: { start, end },
        topics: {
          covered: topicsCovered,
          planned: topicsPlanned
        },
        classProgress
      };

      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async generateMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.query;
      
      // Default to current month if no dates specified
      const currentDate = new Date();
      const reportYear = year ? parseInt(year as string) : currentDate.getFullYear();
      const reportMonth = month ? parseInt(month as string) - 1 : currentDate.getMonth(); // Month is 0-indexed
      
      const start = new Date(reportYear, reportMonth, 1);
      const end = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

      // Get topics covered in this month
      const topicsCovered = await Topic.countDocuments({
        completed: true,
        updatedAt: { $gte: start, $lte: end }
      });

      // Get total topics planned for this month
      const topicsPlanned = await Topic.countDocuments({
        deadline: { $gte: start, $lte: end }
      });

      // Subject-wise completion status
      const subjectProgress = await Progress.aggregate([
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
            _id: '$subject._id',
            subjectName: { $first: '$subjectData.name' },
            avgCompletion: { $avg: '$percentageComplete' },
            totalChapters: { $sum: '$totalChapters' },
            completedChapters: { $sum: '$completedChapters' },
            totalTopics: { $sum: '$totalTopics' },
            completedTopics: { $sum: '$completedTopics' }
          }
        }
      ]);

      // Class-wise completion status
      const classProgress = await Progress.aggregate([
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
          $lookup: {
            from: 'classes',
            localField: 'subjectData.class',
            foreignField: '_id',
            as: 'classData'
          }
        },
        { $unwind: '$classData' },
        {
          $group: {
            _id: '$classData._id',
            className: { $first: '$classData.name' },
            avgCompletion: { $avg: '$percentageComplete' }
          }
        }
      ]);

      // Department-wise completion status
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
            avgCompletion: { $avg: '$percentageComplete' },
            subjectCount: { $sum: 1 }
          }
        }
      ]);

      const report = {
        generatedAt: new Date(),
        month: { start, end },
        topics: {
          covered: topicsCovered,
          planned: topicsPlanned
        },
        subjectProgress,
        classProgress,
        departmentProgress
      };

      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController(); 