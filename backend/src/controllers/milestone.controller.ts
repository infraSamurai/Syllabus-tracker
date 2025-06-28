import { Request, Response, NextFunction } from 'express';
import Milestone from '../models/Milestone';
import Progress from '../models/Progress';
import KPI from '../models/KPI';

export class MilestoneController {
  async getMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      const milestones = await Milestone.find({ isActive: true })
        .populate('achievedBy', 'name email')
        .sort({ target: 1 });
      
      res.json(milestones);
    } catch (error) {
      next(error);
    }
  }

  async createMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const milestone = new Milestone(req.body);
      await milestone.save();
      res.status(201).json(milestone);
    } catch (error) {
      next(error);
    }
  }

  async updateMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const milestone = await Milestone.findByIdAndUpdate(id, req.body, { new: true });
      
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
      
      res.json(milestone);
    } catch (error) {
      next(error);
    }
  }

  async deleteMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await Milestone.findByIdAndDelete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async checkMilestoneAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const milestone = await Milestone.findById(id);
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
      
      // Check if user has already achieved this milestone
      if (milestone.achievedBy.includes(userId)) {
        return res.json({ achieved: true, message: 'Already achieved' });
      }
      
      // Check conditions based on milestone type
      let achieved = false;
      
      switch (milestone.type) {
        case 'progress':
          const progress = await Progress.find({ teacher: userId });
          const avgProgress = progress.reduce((sum, p) => sum + p.percentageComplete, 0) / progress.length;
          achieved = this.checkConditions(milestone.conditions, { progress: avgProgress });
          break;
          
        case 'kpi':
          const kpis = await KPI.find({ /* filter by user's subjects */ });
          const achievedKPIs = kpis.filter(k => k.achieved).length;
          const kpiRate = (achievedKPIs / kpis.length) * 100;
          achieved = this.checkConditions(milestone.conditions, { kpiRate });
          break;
          
        case 'completion':
          // Check subject/chapter/topic completion
          // Implementation depends on your specific requirements
          break;
      }
      
      if (achieved) {
        milestone.achievedBy.push(userId);
        await milestone.save();
        
        // You might want to trigger notifications or rewards here
        res.json({ 
          achieved: true, 
          message: 'Congratulations! Milestone achieved!',
          reward: milestone.reward 
        });
      } else {
        res.json({ achieved: false, message: 'Keep going!' });
      }
    } catch (error) {
      next(error);
    }
  }

  async getUserAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      
      const achievements = await Milestone.find({
        achievedBy: userId
      }).select('-achievedBy');
      
      res.json(achievements);
    } catch (error) {
      next(error);
    }
  }

  private checkConditions(conditions: any[], data: any): boolean {
    return conditions.every(condition => {
      const value = data[condition.metric];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'greater':
          return value > condition.value;
        case 'less':
          return value < condition.value;
        case 'between':
          return value >= condition.value && value <= condition.value2;
        default:
          return false;
      }
    });
  }
} 