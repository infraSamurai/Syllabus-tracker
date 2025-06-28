import { Request, Response, NextFunction } from 'express';
import Subject from '../models/Subject';
import Progress from '../models/Progress';
import ProgressHistory from '../models/ProgressHistory';
import KPI from '../models/KPI';

export class AnalyticsController {
  async getTrendAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(period));
      
      const trendData = await ProgressHistory.aggregate([
        {
          $match: {
            date: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
            },
            avgProgress: { $avg: '$percentageComplete' },
            totalTopicsCompleted: { $sum: '$topicsCompleted' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);
      
      res.json(trendData);
    } catch (error) {
      next(error);
    }
  }

  async getForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { subjectId } = req.query;
      
      // Get historical progress data
      const history = await ProgressHistory.find(
        subjectId ? { subject: subjectId } : {}
      )
        .sort({ date: -1 })
        .limit(30)
        .lean();
      
      if (history.length < 2) {
        return res.json({ 
          message: 'Insufficient data for forecasting',
          predictions: [] 
        });
      }
      
      // Simple linear regression for forecasting
      const predictions: any[] = [];
      const xValues: number[] = history.map((_: any, i: number) => i);
      const yValues: number[] = history.map((h: any) => h.percentageComplete);
      
      const n = xValues.length;
      const sumX = xValues.reduce((a: number, b: number) => a + b, 0);
      const sumY = yValues.reduce((a: number, b: number) => a + b, 0);
      const sumXY = xValues.reduce((total: number, x: number, i: number) => total + x * yValues[i], 0);
      const sumX2 = xValues.reduce((total: number, x: number) => total + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Generate predictions for next 30 days
      for (let i = 0; i < 30; i++) {
        const predictedProgress = Math.min(100, intercept + slope * (n + i));
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        
        predictions.push({
          date: futureDate,
          predictedProgress: Math.max(0, predictedProgress),
          confidence: Math.max(0.5, 1 - (i * 0.01)) // Confidence decreases over time
        });
      }
      
      // Calculate estimated completion date
      const daysToComplete = (100 - yValues[0]) / slope;
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + Math.ceil(daysToComplete));
      
      res.json({
        currentProgress: yValues[0],
        dailyProgressRate: slope,
        estimatedCompletionDate: completionDate,
        predictions
      });
    } catch (error) {
      next(error);
    }
  }

  async getComparativeAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupBy = 'department' } = req.query;
      
      let pipeline: any[] = [];
      
      switch (groupBy) {
        case 'department':
          pipeline = [
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
                onTrackCount: { 
                  $sum: { $cond: [{ $eq: ['$isOnTrack', true] }, 1, 0] } 
                }
              }
            }
          ];
          break;
          
        case 'class':
          pipeline = [
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
                _id: '$classData.name',
                avgProgress: { $avg: '$percentageComplete' },
                totalSubjects: { $sum: 1 },
                onTrackCount: { 
                  $sum: { $cond: [{ $eq: ['$isOnTrack', true] }, 1, 0] } 
                }
              }
            }
          ];
          break;
          
        case 'teacher':
          pipeline = [
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
                _id: '$teacherData.name',
                avgProgress: { $avg: '$percentageComplete' },
                totalSubjects: { $sum: 1 },
                onTrackCount: { 
                  $sum: { $cond: [{ $eq: ['$isOnTrack', true] }, 1, 0] } 
                }
              }
            }
          ];
          break;
      }
      
      const analysis = await Progress.aggregate(pipeline);
      
      // Add KPI achievement rate
      const kpiData = await KPI.aggregate([
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
            _id: groupBy === 'department' ? '$subjectData.department' : 
                 groupBy === 'class' ? '$subjectData.class' : '$subjectData.teacher',
            totalKPIs: { $sum: 1 },
            achievedKPIs: { 
              $sum: { $cond: [{ $eq: ['$achieved', true] }, 1, 0] } 
            }
          }
        }
      ]);
      
      // Merge KPI data with progress data
      const mergedAnalysis = analysis.map((item: any) => {
        const kpiInfo = kpiData.find((k: any) => k._id === item._id) || { 
          totalKPIs: 0, 
          achievedKPIs: 0 
        };
        
        return {
          ...item,
          kpiAchievementRate: kpiInfo.totalKPIs > 0 
            ? (kpiInfo.achievedKPIs / kpiInfo.totalKPIs) * 100 
            : 0,
          performanceScore: (
            item.avgProgress * 0.4 + 
            (item.onTrackCount / item.totalSubjects) * 100 * 0.3 + 
            (kpiInfo.totalKPIs > 0 ? (kpiInfo.achievedKPIs / kpiInfo.totalKPIs) * 100 * 0.3 : 0)
          )
        };
      });
      
      res.json({
        groupBy,
        data: mergedAnalysis.sort((a: any, b: any) => b.performanceScore - a.performanceScore)
      });
    } catch (error) {
      next(error);
    }
  }
} 