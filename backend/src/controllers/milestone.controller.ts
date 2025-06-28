import { Request, Response, NextFunction } from 'express';
import Milestone from '../models/Milestone';
import Progress from '../models/Progress';
import Topic from '../models/Topic';
import Subject from '../models/Subject';
import KPI from '../models/KPI';
import { User } from '../models/User';
import { Types } from 'mongoose';

export class MilestoneController {
  async getMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      const milestones = await Milestone.find()
        .populate('unlockedBy', 'name email')
        .sort({ 'criteria.value': 1 });
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
      const milestone = await Milestone.findByIdAndUpdate(id, req.body, { 
        new: true, 
        runValidators: true 
      });
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
      const milestone = await Milestone.findByIdAndDelete(id);
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
      res.json({ message: 'Milestone deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async checkUserMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const milestones = await Milestone.find();
      const newlyUnlocked = [];

      for (const milestone of milestones) {
        // Skip if user already unlocked this milestone
        if (milestone.unlockedBy.includes(userId as unknown as Types.ObjectId)) continue;

        let criteriaMetValue = 0;

        switch (milestone.criteria.type) {
          case 'topics_completed':
            const completedTopics = await Topic.countDocuments({ completed: true });
            criteriaMetValue = completedTopics;
            break;

          case 'subjects_completed':
            const progress = await Progress.find({ percentageComplete: 100 });
            criteriaMetValue = progress.length;
            break;

          case 'kpis_achieved':
            const achievedKPIs = await KPI.countDocuments({ isAchieved: true });
            criteriaMetValue = achievedKPIs;
            break;

          case 'streak_days':
            // This would require tracking daily activity - simplified for now
            criteriaMetValue = 0; // Implement streak tracking logic
            break;
        }

        if (criteriaMetValue >= milestone.criteria.value) {
          milestone.unlockedBy.push(userId as unknown as Types.ObjectId);
          await milestone.save();
          newlyUnlocked.push(milestone);
        }
      }

      res.json({
        newlyUnlocked,
        message: newlyUnlocked.length > 0 
          ? `Congratulations! You've unlocked ${newlyUnlocked.length} new milestone(s)!` 
          : 'No new milestones unlocked'
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const allMilestones = await Milestone.find().sort({ 'criteria.value': 1 });
      
      const userMilestones = {
        unlocked: allMilestones.filter(m => m.unlockedBy.includes(userId as unknown as Types.ObjectId)),
        locked: allMilestones.filter(m => !m.unlockedBy.includes(userId as unknown as Types.ObjectId)),
        totalPoints: 0
      };

      // Calculate total points
      userMilestones.totalPoints = userMilestones.unlocked
        .filter(m => m.reward.type === 'points')
        .reduce((sum, m) => sum + (Number(m.reward.value) || 0), 0);

      res.json(userMilestones);
    } catch (error) {
      next(error);
    }
  }
}

export const milestoneController = new MilestoneController(); 