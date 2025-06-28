import { Request, Response, NextFunction } from 'express';
import KPI from '../models/KPI';
import Subject from '../models/Subject';

export class KPIController {
  async getKPIs(req: Request, res: Response, next: NextFunction) {
    try {
      const { subjectId } = req.query;
      const filter = subjectId ? { subject: subjectId } : {};
      
      const kpis = await KPI.find(filter)
        .populate('subject', 'name code')
        .sort({ priority: -1, deadline: 1 });
      
      res.json(kpis);
    } catch (error) {
      next(error);
    }
  }

  async createKPI(req: Request, res: Response, next: NextFunction) {
    try {
      const kpi = new KPI(req.body);
      await kpi.save();
      res.status(201).json(kpi);
    } catch (error) {
      next(error);
    }
  }

  async updateKPI(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { currentValue, achieved } = req.body;
      
      const updateData: any = { ...req.body };
      
      // If KPI is marked as achieved, set achievedAt
      if (achieved && !updateData.achievedAt) {
        updateData.achievedAt = new Date();
      }
      
      const kpi = await KPI.findByIdAndUpdate(id, updateData, { new: true });
      if (!kpi) {
        return res.status(404).json({ message: 'KPI not found' });
      }
      
      res.json(kpi);
    } catch (error) {
      next(error);
    }
  }

  async deleteKPI(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await KPI.findByIdAndDelete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getKPIAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await KPI.aggregate([
        {
          $group: {
            _id: '$priority',
            total: { $sum: 1 },
            achieved: { 
              $sum: { $cond: [{ $eq: ['$achieved', true] }, 1, 0] } 
            },
            avgProgress: { 
              $avg: { 
                $multiply: [
                  { $divide: ['$currentValue', '$target'] }, 
                  100
                ] 
              } 
            }
          }
        }
      ]);
      
      const subjectKPIs = await KPI.aggregate([
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
            totalKPIs: { $sum: 1 },
            achievedKPIs: { 
              $sum: { $cond: [{ $eq: ['$achieved', true] }, 1, 0] } 
            }
          }
        }
      ]);
      
      res.json({
        byPriority: analytics,
        byDepartment: subjectKPIs
      });
    } catch (error) {
      next(error);
    }
  }
} 