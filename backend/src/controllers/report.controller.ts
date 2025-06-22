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
  async getWeeklyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const [startOfWeek, endOfWeek] = getWeekRange();

      // Teacher-wise completion status
      const teacherProgress = await Progress.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'teacher',
            foreignField: '_id',
            as: 'teacherData'
          }
        },
        { $unwind: '$teacherData' },
        {
          $group: {
            _id: '$teacher',
            teacherName: { $first: '$teacherData.name' },
            subjects: { $addToSet: '$subject' },
            avgCompletion: { $avg: '$percentageComplete' }
          }
        }
      ]);

      // Topics covered vs planned (for the week)
      const topicsCovered = await Topic.countDocuments({ completed: true, completedAt: { $gte: startOfWeek, $lte: endOfWeek } });
      const topicsPlanned = await Topic.countDocuments({ deadline: { $gte: startOfWeek, $lte: endOfWeek } });

      // Class-wise progress summary
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
            avgCompletion: { $avg: '$percentageComplete' },
            subjects: { $addToSet: '$subjectData.name' }
          }
        }
      ]);

      // Upcoming deadlines alert (topics due this week and not completed)
      const upcomingDeadlines = await Topic.find({
        deadline: { $gte: startOfWeek, $lte: endOfWeek },
        completed: false
      });

      res.json({
        generatedAt: new Date(),
        week: { start: startOfWeek, end: endOfWeek },
        teacherProgress,
        topics: { covered: topicsCovered, planned: topicsPlanned },
        classProgress,
        upcomingDeadlines
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const [startOfMonth, endOfMonth] = getMonthRange();

      // Department-wise analytics
      const departmentAnalytics = await Progress.aggregate([
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
            totalSubjects: { $sum: 1 },
            subjectsBehind: { $sum: { $cond: [{ $eq: ['$isOnTrack', false] }, 1, 0] } }
          }
        }
      ]);

      // Teacher performance metrics (for the month)
      const teacherPerformance = await Progress.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'teacher',
            foreignField: '_id',
            as: 'teacherData'
          }
        },
        { $unwind: '$teacherData' },
        {
          $match: {
            lastUpdated: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$teacher',
            teacherName: { $first: '$teacherData.name' },
            avgCompletion: { $avg: '$percentageComplete' },
            subjects: { $addToSet: '$subject' }
          }
        }
      ]);

      // Syllabus completion projections (estimate based on current rate)
      // For each subject, estimate completion date based on current progress rate
      const subjects = await Subject.find().populate('class').populate({
        path: 'chapters',
        populate: {
          path: 'topics'
        }
      });
      const projections = [];

      for (const subject of subjects) {
        if (!subject.chapters || subject.chapters.length === 0) continue;

        let completedTopicsCount = 0;
        let totalTopicsCount = 0;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        for (const chapter of subject.chapters as any[]) {
          totalTopicsCount += chapter.topics.length;
          for (const topic of chapter.topics as any) {
            if (topic.completed && topic.completedAt && new Date(topic.completedAt) > thirtyDaysAgo) {
              completedTopicsCount++;
            }
          }
        }

        const overallProgress = await Progress.findOne({ subject: subject._id });
        if (!overallProgress) continue;
        
        const topicsCompletedInLast30Days = completedTopicsCount;
        const completionRatePerDay = topicsCompletedInLast30Days / 30; // Topics per day

        let projectedCompletionDate = null;
        if (completionRatePerDay > 0) {
          const remainingTopics = totalTopicsCount - (overallProgress.completedTopics || 0);
          if (remainingTopics > 0) {
            const daysToComplete = remainingTopics / completionRatePerDay;
            projectedCompletionDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);
          } else {
            // Already completed
            projectedCompletionDate = new Date();
          }
        }

        projections.push({
          subject: subject.name,
          class: (subject.class as any)?.name || 'N/A',
          currentCompletion: overallProgress.percentageComplete,
          projectedCompletionDate
        });
      }

      // Areas needing attention (subjects with low progress or overdue topics)
      const lowProgressSubjects = await Progress.aggregate([
        {
          $match: { percentageComplete: { $lt: 50 } }
        },
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
          $project: {
            subject: '$subjectData.name',
            code: '$subjectData.code',
            department: '$subjectData.department',
            percentageComplete: 1
          }
        }
      ]);
      const overdueTopics = await Topic.find({ deadline: { $lt: new Date() }, completed: false });

      res.json({
        generatedAt: new Date(),
        month: { start: startOfMonth, end: endOfMonth },
        departmentAnalytics,
        teacherPerformance,
        projections,
        areasNeedingAttention: { lowProgressSubjects, overdueTopics }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController(); 