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

      // First, clean up any orphaned tasks
      const cleanupResult = await this.cleanupOrphanedTasksInternal();

      let generated = 0;
      let overdueCount = 0;
      const overdueTopics: any[] = [];
      
      // Find all subjects directly (not through Progress records)
      const subjects = await Subject.find().populate({
        path: 'chapters',
        populate: { path: 'topics' }
      }).populate('class');
      
      for (const subject of subjects) {
        // Skip if subject has no chapters or topics
        if (!subject.chapters || subject.chapters.length === 0) continue;
        
        // Find the next incomplete topic for this subject
        const nextTopic = this.findNextIncompleteTopic(subject.chapters as any[]);
        
        if (!nextTopic) {
          // All topics are completed for this subject
          continue;
        }
        
        const topicDeadline = new Date(nextTopic.deadline);
        const today = new Date();
        
        // Calculate how many days we have until the deadline
        const daysUntilDeadline = Math.ceil((topicDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if topic is overdue
        const isOverdue = daysUntilDeadline < 0;
        
        if (isOverdue) {
          overdueCount++;
          overdueTopics.push({
            subject: subject.name,
            class: (subject.class as any)?.name || 'Unknown Class',
            topic: nextTopic.title,
            deadline: nextTopic.deadline,
            daysOverdue: Math.abs(daysUntilDeadline)
          });
        }
        
        // If deadline is in the past, create a high-priority task for today
        if (isOverdue) {
          await this.createTaskForDate(null, subject, nextTopic, today, 'high', generated);
          generated++;
          continue;
        }
        
        // For the next incomplete topic, create a task starting today
        // Work on this topic for up to 3 days or until deadline, whichever comes first
        const workDays = Math.min(3, Math.max(1, daysUntilDeadline));
        
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
            await this.createTaskForDate(null, subject, nextTopic, workDate, priority, generated);
            generated++;
          }
        }
      }
      
      // Create response message with overdue information
      let message = `Generated ${generated} daily tasks for next incomplete topics from ${start.toDateString()} to ${end.toDateString()}.`;
      
      if (cleanupResult.deletedCount > 0) {
        message += ` 🧹 Cleaned up ${cleanupResult.deletedCount} orphaned task${cleanupResult.deletedCount > 1 ? 's' : ''}.`;
      }
      
      if (overdueCount > 0) {
        message += ` ⚠️ ${overdueCount} overdue topic${overdueCount > 1 ? 's' : ''} found!`;
      }
      
      res.json({ 
        message,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        overdueCount,
        overdueTopics,
        generated,
        cleanupResult
      });
    } catch (error) {
      next(error);
    }
  }

  private findNextIncompleteTopic(chapters: any[]): any | null {
    // Sort chapters by number to ensure proper order
    const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
    
    for (const chapter of sortedChapters) {
      if (!chapter.topics || chapter.topics.length === 0) continue;
      
      // Sort topics by some criteria (could be by deadline or creation date)
      const sortedTopics = [...chapter.topics].sort((a, b) => {
        // First sort by completion status (incomplete first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Then sort by deadline (earliest first)
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
      
      // Find the first incomplete topic
      const nextTopic = sortedTopics.find((topic: any) => !topic.completed);
      if (nextTopic) {
        return nextTopic;
      }
    }
    
    return null; // No incomplete topics found
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
      const taskData = req.body;
      const task = await Task.create(taskData);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const task = await Task.findByIdAndUpdate(id, updateData, { new: true });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await Task.findByIdAndDelete(id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  private async cleanupOrphanedTasksInternal() {
    // Get all existing topics
    const subjects = await Subject.find().populate({
      path: 'chapters',
      populate: { path: 'topics' }
    });

    // Collect all valid topic titles
    const validTopicTitles = new Set<string>();
    for (const subject of subjects) {
      if (subject.chapters) {
        for (const chapter of subject.chapters as any[]) {
          if (chapter.topics) {
            for (const topic of chapter.topics) {
              validTopicTitles.add(topic.title);
            }
          }
        }
      }
    }

    // Find and delete tasks with titles that don't exist in any topic
    const allTasks = await Task.find();
    let deletedCount = 0;

    for (const task of allTasks) {
      if (!validTopicTitles.has(task.title)) {
        await Task.findByIdAndDelete(task._id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} orphaned tasks during task generation`);
    }

    return { deletedCount };
  }
}

export const taskController = new TaskController(); 