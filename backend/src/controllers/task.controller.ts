import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import Topic from '../models/Topic';
import { User } from '../models/User';
import { Progress } from '../models/Progress';

export class TaskController {
  async generateDailyTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      
      // Default to generating tasks for the next 30 days if no dates specified
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date();
      end.setDate(end.getDate() + 30); // Default to 30 days ahead
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      let generated = 0;
      
      // Find all subjects directly (not through Progress records)
      const subjects = await Subject.find().populate({
        path: 'chapters',
        populate: { path: 'topics' }
      }).populate('class');
      
      for (const subject of subjects) {
        // Skip if subject has no chapters or topics
        if (!subject.chapters || subject.chapters.length === 0) continue;
        
        for (const chapter of subject.chapters as any[]) {
          if (!chapter.topics || chapter.topics.length === 0) continue;
          
          for (const topic of chapter.topics as any[]) {
            if (topic.completed) continue; // Skip completed topics
            
            const topicDeadline = new Date(topic.deadline);
            const today = new Date();
            
            // Calculate how many days we have until the deadline
            const daysUntilDeadline = Math.ceil((topicDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // If deadline is in the past, create a high-priority task for today
            if (daysUntilDeadline < 0) {
              await this.createTaskForDate(null, subject, topic, today, 'high', generated);
              generated++;
              continue;
            }
            
            // Distribute the topic across days leading up to the deadline
            // Start working on topics at least 7 days before deadline, or immediately if less than 7 days
            const startWorkingDays = Math.max(7, daysUntilDeadline);
            const daysToWorkOn = Math.min(startWorkingDays, daysUntilDeadline);
            
            // Calculate how many days to work on this topic (minimum 1 day)
            const workDays = Math.max(1, Math.ceil(daysToWorkOn / 3)); // Work on topic over multiple days
            
            // Distribute work across days
            for (let i = 0; i < workDays; i++) {
              const workDate = new Date(today);
              workDate.setDate(today.getDate() + i);
              
              // Only create tasks within the specified date range
              if (workDate >= start && workDate <= end) {
                // Determine priority based on how close to deadline
                let priority = 'low';
                if (daysUntilDeadline <= 1) priority = 'high';
                else if (daysUntilDeadline <= 3) priority = 'medium';
                
                // Create task for this specific day
                await this.createTaskForDate(null, subject, topic, workDate, priority, generated);
                generated++;
              }
            }
          }
        }
      }
      
      res.json({ 
        message: `Generated ${generated} daily tasks from ${start.toDateString()} to ${end.toDateString()}.`,
        dateRange: { start: start.toISOString(), end: end.toISOString() }
      });
    } catch (error) {
      next(error);
    }
  }

  private async createTaskForDate(teacherId: any, subject: any, topic: any, date: Date, priority: string, index: number) {
    // Avoid duplicate tasks for the same topic on the same date
    const exists = await Task.findOne({
      teacher: teacherId,
      class: subject.class,
      subject: subject._id,
      date: date,
      title: topic.title
    });
    
    if (!exists) {
      const taskDate = new Date(date);
      taskDate.setHours(0, 0, 0, 0);
      
      await Task.create({
        teacher: teacherId, // This will be null for now since we're not using teacher assignments
        class: subject.class,
        subject: subject._id,
        date: taskDate,
        title: topic.title,
        completed: false,
        priority,
        notes: `Deadline: ${new Date(topic.deadline).toLocaleDateString()}`
      });
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      // Allow filtering by teacher and date
      const { teacherId, date } = req.query;
      const filter: any = {};
      if (teacherId) filter.teacher = teacherId;
      if (date) {
        const d = new Date(date as string);
        d.setHours(0,0,0,0);
        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);
        filter.date = { $gte: d, $lt: nextDay };
      }
      const tasks = await Task.find(filter).populate('teacher').populate('class').populate('subject');
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async markComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
      
      // Toggle the completion status
      task.completed = !task.completed;
      await task.save();
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const task = await Task.findByIdAndUpdate(id, { notes }, { new: true });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  // Basic CRUD (create, update, delete)
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Create a new task
      res.json({ message: 'Task created (to be implemented)' });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Update a task
      res.json({ message: 'Task updated (to be implemented)' });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Delete a task
      res.json({ message: 'Task deleted (to be implemented)' });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController(); 