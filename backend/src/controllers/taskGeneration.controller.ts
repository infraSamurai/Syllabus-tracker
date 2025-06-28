import { Request, Response } from 'express';
import taskGenerationService from '../services/taskGeneration.service';
import Task from '../models/Task';

export class TaskGenerationController {
  /**
   * Generate daily tasks for all subjects
   */
  async generateDailyTasks(req: Request, res: Response): Promise<void> {
    try {
      await taskGenerationService.generateDailyTasks();
      
      res.status(200).json({
        success: true,
        message: 'Daily tasks generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating daily tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate daily tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate weekly tasks for all subjects
   */
  async generateWeeklyTasks(req: Request, res: Response): Promise<void> {
    try {
      await taskGenerationService.generateWeeklyTasks();
      
      res.status(200).json({
        success: true,
        message: 'Weekly tasks generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating weekly tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate weekly tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate monthly tasks for all subjects
   */
  async generateMonthlyTasks(req: Request, res: Response): Promise<void> {
    try {
      await taskGenerationService.generateMonthlyTasks();
      
      res.status(200).json({
        success: true,
        message: 'Monthly tasks generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating monthly tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate all types of tasks (daily, weekly, monthly)
   */
  async generateAllTasks(req: Request, res: Response): Promise<void> {
    try {
      await taskGenerationService.generateAllTasks();
      
      res.status(200).json({
        success: true,
        message: 'All tasks generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating all tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get task generation configuration
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = taskGenerationService.getConfig();
      
      res.status(200).json({
        success: true,
        config
      });
    } catch (error) {
      console.error('Error getting task generation config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update task generation configuration
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const { dailyTasksEnabled, weeklyTasksEnabled, monthlyTasksEnabled, daysBeforeDeadline, priorityThreshold } = req.body;
      
      taskGenerationService.updateConfig({
        dailyTasksEnabled,
        weeklyTasksEnabled,
        monthlyTasksEnabled,
        daysBeforeDeadline,
        priorityThreshold
      });
      
      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        config: taskGenerationService.getConfig()
      });
    } catch (error) {
      console.error('Error updating task generation config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get generated tasks with filters
   */
  async getGeneratedTasks(req: Request, res: Response): Promise<void> {
    try {
      const { type, class: classId, subject: subjectId, priority, date, completed } = req.query;
      
      const filter: any = {};
      
      if (type) filter.type = type;
      if (classId) filter.class = classId;
      if (subjectId) filter.subject = subjectId;
      if (priority) filter.priority = priority;
      if (completed !== undefined) filter.completed = completed === 'true';
      if (date) {
        const dateFilter = new Date(date as string);
        filter.date = {
          $gte: new Date(dateFilter.setHours(0, 0, 0, 0)),
          $lt: new Date(dateFilter.setHours(23, 59, 59, 999))
        };
      }
      
      const tasks = await Task.find(filter)
        .populate('class', 'name')
        .populate('subject', 'name')
        .sort({ date: -1, priority: -1 });
      
      res.status(200).json({
        success: true,
        tasks,
        count: tasks.length
      });
    } catch (error) {
      console.error('Error getting generated tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      const [dailyStats, weeklyStats, monthlyStats, overdueStats] = await Promise.all([
        Task.countDocuments({ 
          date: { $gte: startOfDay, $lte: endOfDay },
          type: 'daily'
        }),
        Task.countDocuments({ 
          date: { $gte: startOfDay, $lte: endOfDay },
          type: 'weekly'
        }),
        Task.countDocuments({ 
          date: { $gte: startOfDay, $lte: endOfDay },
          type: 'monthly'
        }),
        Task.countDocuments({ 
          completed: false,
          priority: 'high',
          date: { $lt: startOfDay }
        })
      ]);
      
      const priorityStats = await Task.aggregate([
        { $match: { completed: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);
      
      res.status(200).json({
        success: true,
        stats: {
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats,
          overdue: overdueStats,
          byPriority: priorityStats
        }
      });
    } catch (error) {
      console.error('Error getting task stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clean up old completed tasks
   */
  async cleanupOldTasks(req: Request, res: Response): Promise<void> {
    try {
      await taskGenerationService.cleanupOldTasks();
      
      res.status(200).json({
        success: true,
        message: 'Old tasks cleaned up successfully'
      });
    } catch (error) {
      console.error('Error cleaning up old tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean up old tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clean up duplicate tasks
   */
  async cleanupDuplicateTasks(req: Request, res: Response): Promise<void> {
    try {
      await taskGenerationService.cleanupDuplicateTasks();
      
      res.status(200).json({
        success: true,
        message: 'Duplicate tasks cleaned up successfully'
      });
    } catch (error) {
      console.error('Error cleaning up duplicate tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean up duplicate tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate tasks for a specific subject
   */
  async generateTasksForSubject(req: Request, res: Response): Promise<void> {
    try {
      const { subjectId } = req.params;
      const { types = ['daily', 'weekly', 'monthly'] } = req.body;
      
      // This would require modifying the service to accept subject ID
      // For now, we'll generate all tasks and filter by subject
      await taskGenerationService.generateAllTasks();
      
      const tasks = await Task.find({ subject: subjectId })
        .populate('class', 'name')
        .populate('subject', 'name')
        .sort({ date: -1, priority: -1 });
      
      res.status(200).json({
        success: true,
        message: `Tasks generated for subject ${subjectId}`,
        tasks,
        count: tasks.length
      });
    } catch (error) {
      console.error('Error generating tasks for subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate tasks for subject',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update a specific task
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const task = await Task.findByIdAndUpdate(
        id,
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('class', 'name').populate('subject', 'name');
      
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        task
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new TaskGenerationController(); 