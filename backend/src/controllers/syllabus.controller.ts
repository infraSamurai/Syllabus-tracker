import { Request, Response, NextFunction } from 'express';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';
import { Topic } from '../models/Topic';
import { Progress } from '../models/Progress';

export class SyllabusController {
  async updateTopicProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { topicId } = req.params;
      const { status, teacherNotes, needsRevision } = req.body;
      const teacherId = req.user?.id;

      if (!teacherId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const topic = await Topic.findByIdAndUpdate(
        topicId,
        {
          status,
          teacherNotes,
          needsRevision,
          actualDate: status === 'completed' ? new Date() : undefined
        },
        { new: true }
      );

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      // Update chapter progress
      await this.updateChapterProgress(topic.chapter);
      
      // Update overall progress
      const chapter = await Chapter.findById(topic.chapter);
      if (chapter) {
        await this.updateSubjectProgress(chapter.subject, teacherId);
      }

      res.json(topic);
    } catch (error) {
      next(error);
    }
  }

  async getSubjectProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { subjectId } = req.params;
      
      const chapters = await Chapter.find({ subject: subjectId })
        .populate('subject')
        .sort({ number: 1 });

      const chaptersWithTopics = await Promise.all(
        chapters.map(async (chapter) => {
          const topics = await Topic.find({ chapter: chapter._id })
            .sort({ plannedDate: 1 });
          return { ...chapter.toObject(), topics };
        })
      );

      const progress = await Progress.findOne({ subject: subjectId });

      res.json({
        chapters: chaptersWithTopics,
        progress
      });
    } catch (error) {
      next(error);
    }
  }

  private async updateChapterProgress(chapterId: any) {
    const topics = await Topic.find({ chapter: chapterId });
    const completedTopics = topics.filter(t => t.status === 'completed').length;
    
    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (completedTopics === topics.length && topics.length > 0) {
      status = 'completed';
    } else if (completedTopics > 0) {
      status = 'in_progress';
    }

    await Chapter.findByIdAndUpdate(chapterId, { status });
  }

  private async updateSubjectProgress(subjectId: any, teacherId: string) {
    const chapters = await Chapter.find({ subject: subjectId });
    const topics = await Topic.find({ 
      chapter: { $in: chapters.map(c => c._id) } 
    });

    const completedChapters = chapters.filter(c => c.status === 'completed').length;
    const completedTopics = topics.filter(t => t.status === 'completed').length;
    
    const percentageComplete = topics.length > 0 
      ? Math.round((completedTopics / topics.length) * 100) 
      : 0;

    const subject = await Subject.findById(subjectId);
    const isOnTrack = subject 
      ? new Date() <= subject.plannedCompletionDate || percentageComplete >= 80
      : true;

    await Progress.findOneAndUpdate(
      { subject: subjectId },
      {
        totalChapters: chapters.length,
        completedChapters,
        totalTopics: topics.length,
        completedTopics,
        percentageComplete,
        isOnTrack,
        lastUpdated: new Date(),
        teacher: teacherId
      },
      { upsert: true, new: true }
    );
  }
}
