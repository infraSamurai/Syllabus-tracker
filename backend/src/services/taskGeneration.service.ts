import Task from '../models/Task';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import Topic from '../models/Topic';
import { Types } from 'mongoose';

export interface TaskGenerationConfig {
  dailyTasksEnabled: boolean;
  weeklyTasksEnabled: boolean;
  monthlyTasksEnabled: boolean;
  daysBeforeDeadline: number;
  priorityThreshold: number;
}

export class TaskGenerationService {
  private config: TaskGenerationConfig = {
    dailyTasksEnabled: true,
    weeklyTasksEnabled: true,
    monthlyTasksEnabled: true,
    daysBeforeDeadline: 7, // Generate tasks 7 days before deadline
    priorityThreshold: 30 // Days threshold for high priority
  };

  /**
   * Generate daily tasks for all subjects based on upcoming deadlines
   */
  async generateDailyTasks(): Promise<void> {
    if (!this.config.dailyTasksEnabled) return;

    const today = new Date();
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get all subjects with their chapters and topics
      const subjects = await Subject.find()
        .populate('class')
        .populate({
          path: 'chapters',
          populate: {
            path: 'topics'
          }
        });

      for (const subject of subjects) {
        await this.generateDailyTasksForSubject(subject, today);
      }

      console.log('✅ Daily tasks generated successfully');
    } catch (error) {
      console.error('❌ Error generating daily tasks:', error);
      throw error;
    }
  }

  /**
   * Generate weekly tasks for subjects with deadlines in the next week
   */
  async generateWeeklyTasks(): Promise<void> {
    if (!this.config.weeklyTasksEnabled) return;

    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    try {
      const subjects = await Subject.find()
        .populate('class')
        .populate({
          path: 'chapters',
          populate: {
            path: 'topics'
          }
        });

      for (const subject of subjects) {
        await this.generateWeeklyTasksForSubject(subject, today, weekFromNow);
      }

      console.log('✅ Weekly tasks generated successfully');
    } catch (error) {
      console.error('❌ Error generating weekly tasks:', error);
      throw error;
    }
  }

  /**
   * Generate monthly tasks for subjects with deadlines in the next month
   */
  async generateMonthlyTasks(): Promise<void> {
    if (!this.config.monthlyTasksEnabled) return;

    const today = new Date();
    const monthFromNow = new Date(today);
    monthFromNow.setMonth(today.getMonth() + 1);

    try {
      const subjects = await Subject.find()
        .populate('class')
        .populate({
          path: 'chapters',
          populate: {
            path: 'topics'
          }
        });

      for (const subject of subjects) {
        await this.generateMonthlyTasksForSubject(subject, today, monthFromNow);
      }

      console.log('✅ Monthly tasks generated successfully');
    } catch (error) {
      console.error('❌ Error generating monthly tasks:', error);
      throw error;
    }
  }

  /**
   * Generate daily tasks for a specific subject
   */
  private async generateDailyTasksForSubject(subject: any, today: Date): Promise<void> {
    const tasks: any[] = [];

    // Check subject deadline
    if (subject.deadline) {
      const daysUntilDeadline = this.getDaysUntilDeadline(subject.deadline);
      if (daysUntilDeadline <= this.config.daysBeforeDeadline && daysUntilDeadline > 0) {
        const priority = this.calculatePriority(daysUntilDeadline);
        tasks.push({
          class: subject.class._id,
          subject: subject._id,
          date: today,
          title: `Complete ${subject.name} - Deadline in ${daysUntilDeadline} days`,
          completed: false,
          priority,
          type: 'daily',
          notes: `Subject deadline: ${new Date(subject.deadline).toLocaleDateString()}`
        });
      }
    }

    // Check chapter deadlines
    for (const chapter of subject.chapters) {
      if (chapter.deadline) {
        const daysUntilDeadline = this.getDaysUntilDeadline(chapter.deadline);
        if (daysUntilDeadline <= this.config.daysBeforeDeadline && daysUntilDeadline > 0) {
          const priority = this.calculatePriority(daysUntilDeadline);
          tasks.push({
            class: subject.class._id,
            subject: subject._id,
            date: today,
            title: `Complete Chapter: ${chapter.title} - ${subject.name}`,
            completed: false,
            priority,
            type: 'daily',
            notes: `Chapter deadline: ${new Date(chapter.deadline).toLocaleDateString()}`
          });
        }
      }

      // Check topic deadlines
      for (const topic of chapter.topics) {
        if (topic.deadline && !topic.completed) {
          const daysUntilDeadline = this.getDaysUntilDeadline(topic.deadline);
          if (daysUntilDeadline <= this.config.daysBeforeDeadline && daysUntilDeadline > 0) {
            const priority = this.calculatePriority(daysUntilDeadline);
            tasks.push({
              class: subject.class._id,
              subject: subject._id,
              date: today,
              title: `Complete Topic: ${topic.title} - ${chapter.title}`,
              completed: false,
              priority,
              type: 'daily',
              notes: `Topic deadline: ${new Date(topic.deadline).toLocaleDateString()}`
            });
          }
        }
      }
    }

    // Check for overdue items
    const overdueTasks = this.generateOverdueTasks(subject, today);
    tasks.push(...overdueTasks);

    // Save tasks (avoid duplicates)
    await this.saveTasksWithoutDuplicates(tasks);
  }

  /**
   * Generate weekly tasks for a specific subject
   */
  private async generateWeeklyTasksForSubject(subject: any, today: Date, weekFromNow: Date): Promise<void> {
    const tasks: any[] = [];

    // Weekly progress review tasks
    const incompleteTopics = this.getIncompleteTopics(subject);
    if (incompleteTopics.length > 0) {
      tasks.push({
        class: subject.class._id,
        subject: subject._id,
        date: today,
        title: `Weekly Review: ${subject.name} Progress`,
        completed: false,
        priority: 'medium',
        type: 'weekly',
        notes: `${incompleteTopics.length} topics remaining to complete`
      });
    }

    // Weekly planning tasks
    const upcomingDeadlines = this.getUpcomingDeadlines(subject, today, weekFromNow);
    if (upcomingDeadlines.length > 0) {
      tasks.push({
        class: subject.class._id,
        subject: subject._id,
        date: today,
        title: `Weekly Planning: ${subject.name}`,
        completed: false,
        priority: 'medium',
        type: 'weekly',
        notes: `${upcomingDeadlines.length} deadlines in the next week`
      });
    }

    await this.saveTasksWithoutDuplicates(tasks);
  }

  /**
   * Generate monthly tasks for a specific subject
   */
  private async generateMonthlyTasksForSubject(subject: any, today: Date, monthFromNow: Date): Promise<void> {
    const tasks: any[] = [];

    // Monthly assessment tasks
    const progress = this.calculateSubjectProgress(subject);
    tasks.push({
      class: subject.class._id,
      subject: subject._id,
      date: today,
      title: `Monthly Assessment: ${subject.name}`,
      completed: false,
      priority: 'medium',
      type: 'monthly',
      notes: `Current progress: ${Math.round(progress)}%`
    });

    // Monthly planning tasks
    const monthlyDeadlines = this.getUpcomingDeadlines(subject, today, monthFromNow);
    if (monthlyDeadlines.length > 0) {
      tasks.push({
        class: subject.class._id,
        subject: subject._id,
        date: today,
        title: `Monthly Planning: ${subject.name}`,
        completed: false,
        priority: 'medium',
        type: 'monthly',
        notes: `${monthlyDeadlines.length} deadlines in the next month`
      });
    }

    await this.saveTasksWithoutDuplicates(tasks);
  }

  /**
   * Generate overdue task notifications
   */
  private generateOverdueTasks(subject: any, today: Date): any[] {
    const tasks: any[] = [];

    // Check for overdue topics
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        if (topic.deadline && !topic.completed && new Date(topic.deadline) < today) {
          tasks.push({
            class: subject.class._id,
            subject: subject._id,
            date: today,
            title: `URGENT: Overdue Topic - ${topic.title}`,
            completed: false,
            priority: 'high',
            type: 'daily',
            notes: `Overdue since: ${new Date(topic.deadline).toLocaleDateString()}`
          });
        }
      }
    }

    return tasks;
  }

  /**
   * Calculate days until deadline
   */
  private getDaysUntilDeadline(deadline: Date): number {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate priority based on days until deadline
   */
  private calculatePriority(daysUntilDeadline: number): 'low' | 'medium' | 'high' {
    if (daysUntilDeadline <= 3) return 'high';
    if (daysUntilDeadline <= this.config.priorityThreshold) return 'medium';
    return 'low';
  }

  /**
   * Get incomplete topics for a subject
   */
  private getIncompleteTopics(subject: any): any[] {
    const incomplete: any[] = [];
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        if (!topic.completed) {
          incomplete.push(topic);
        }
      }
    }
    return incomplete;
  }

  /**
   * Get upcoming deadlines within a date range
   */
  private getUpcomingDeadlines(subject: any, startDate: Date, endDate: Date): any[] {
    const deadlines: any[] = [];

    // Subject deadline
    if (subject.deadline && new Date(subject.deadline) >= startDate && new Date(subject.deadline) <= endDate) {
      deadlines.push({ type: 'subject', title: subject.name, deadline: subject.deadline });
    }

    // Chapter deadlines
    for (const chapter of subject.chapters) {
      if (chapter.deadline && new Date(chapter.deadline) >= startDate && new Date(chapter.deadline) <= endDate) {
        deadlines.push({ type: 'chapter', title: chapter.title, deadline: chapter.deadline });
      }
    }

    // Topic deadlines
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        if (topic.deadline && new Date(topic.deadline) >= startDate && new Date(topic.deadline) <= endDate) {
          deadlines.push({ type: 'topic', title: topic.title, deadline: topic.deadline });
        }
      }
    }

    return deadlines;
  }

  /**
   * Calculate subject progress percentage
   */
  private calculateSubjectProgress(subject: any): number {
    let totalTopics = 0;
    let completedTopics = 0;

    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        totalTopics++;
        if (topic.completed) {
          completedTopics++;
        }
      }
    }

    return totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  }

  /**
   * Save tasks without creating duplicates
   */
  private async saveTasksWithoutDuplicates(tasks: any[]): Promise<void> {
    for (const taskData of tasks) {
      try {
        // More comprehensive duplicate check
        const duplicateCriteria: any = {
          class: taskData.class,
          subject: taskData.subject,
          type: taskData.type,
          completed: false // Only check for incomplete tasks
        };

        // Add title-based check for more specific matching
        if (taskData.title) {
          duplicateCriteria.title = taskData.title;
        }

        // Check for existing incomplete tasks for this subject/type combination
        // within the last 7 days to prevent daily duplicates
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const existingTask = await Task.findOne({
          ...duplicateCriteria,
          createdAt: { $gte: sevenDaysAgo }
        });

        if (!existingTask) {
          // Also check if there are too many pending tasks for this subject
          const pendingTaskCount = await Task.countDocuments({
            class: taskData.class,
            subject: taskData.subject,
            completed: false,
            type: taskData.type
          });

          // Limit to maximum 10 pending tasks per subject/type combination
          if (pendingTaskCount < 10) {
            await Task.create({
              ...taskData,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`✅ Created task: ${taskData.title}`);
          } else {
            console.log(`⚠️ Skipped task creation - too many pending tasks for ${taskData.title}`);
          }
        } else {
          console.log(`⚠️ Skipped duplicate task: ${taskData.title}`);
        }
      } catch (error) {
        console.error(`❌ Error saving task ${taskData.title}:`, error);
      }
    }
  }

  /**
   * Update task generation configuration
   */
  updateConfig(newConfig: Partial<TaskGenerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TaskGenerationConfig {
    return this.config;
  }

  /**
   * Generate all types of tasks
   */
  async generateAllTasks(): Promise<void> {
    await this.generateDailyTasks();
    await this.generateWeeklyTasks();
    await this.generateMonthlyTasks();
  }

  /**
   * Clean up old completed tasks (older than 30 days)
   */
  async cleanupOldTasks(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Task.deleteMany({
      completed: true,
      updatedAt: { $lt: thirtyDaysAgo }
    });

    console.log('✅ Old completed tasks cleaned up');
  }

  /**
   * Clean up duplicate tasks for the same subject/chapter combination
   */
  async cleanupDuplicateTasks(): Promise<void> {
    try {
      // Find and remove duplicate tasks based on class, subject, title, and type
      const duplicates = await Task.aggregate([
        {
          $match: {
            completed: false
          }
        },
        {
          $group: {
            _id: {
              class: '$class',
              subject: '$subject',
              title: '$title',
              type: '$type'
            },
            count: { $sum: 1 },
            tasks: { $push: '$_id' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      let removedCount = 0;
      for (const duplicate of duplicates) {
        // Keep the first task, remove the rest
        const tasksToRemove = duplicate.tasks.slice(1);
        await Task.deleteMany({ _id: { $in: tasksToRemove } });
        removedCount += tasksToRemove.length;
      }

      console.log(`✅ Cleaned up ${removedCount} duplicate tasks`);
    } catch (error) {
      console.error('❌ Error cleaning up duplicate tasks:', error);
    }
  }
}

export default new TaskGenerationService(); 