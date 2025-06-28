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
        .sort({ createdAt: -1 });
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
      const kpi = await KPI.findByIdAndUpdate(id, req.body, { 
        new: true, 
        runValidators: true 
      });
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
      const kpi = await KPI.findByIdAndDelete(id);
      if (!kpi) {
        return res.status(404).json({ message: 'KPI not found' });
      }
      res.json({ message: 'KPI deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { current } = req.body;
      
      const kpi = await KPI.findById(id);
      if (!kpi) {
        return res.status(404).json({ message: 'KPI not found' });
      }
      
      kpi.current = current;
      await kpi.save(); // This will trigger the pre-save hook to update achievement status
      
      res.json(kpi);
    } catch (error) {
      next(error);
    }
  }

  async getKPIDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await KPI.find().populate('subject', 'name code class');
      
      const dashboard = {
        total: kpis.length,
        achieved: kpis.filter(k => k.isAchieved).length,
        inProgress: kpis.filter(k => !k.isAchieved && k.current > 0).length,
        notStarted: kpis.filter(k => k.current === 0).length,
        byCategory: {
          completion: kpis.filter(k => k.category === 'completion'),
          quality: kpis.filter(k => k.category === 'quality'),
          timeliness: kpis.filter(k => k.category === 'timeliness'),
          engagement: kpis.filter(k => k.category === 'engagement')
        },
        recentAchievements: kpis
          .filter(k => k.isAchieved && k.achievedAt)
          .sort((a, b) => b.achievedAt!.getTime() - a.achievedAt!.getTime())
          .slice(0, 5)
      };
      
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
}

export const kpiController = new KPIController(); 