import Subject, { ISubject } from '../models/Subject';
import Chapter, { IChapter } from '../models/Chapter';
import Topic, { ITopic } from '../models/Topic';
import { Progress } from '../models/Progress';
import { User } from '../models/User';
import Task from '../models/Task';

export const getSubjects = async (): Promise<ISubject[]> => {
  return Subject.find().populate('class').populate({
    path: 'chapters',
    populate: {
      path: 'topics'
    }
  }).sort({ createdAt: -1 });
};

export const createSubject = async (subjectData: Partial<ISubject>): Promise<ISubject> => {
  const subject = new Subject(subjectData);
  await subject.save();

  const teacher = await User.findOne({ role: 'teacher' });
  if (!teacher) {
    console.warn('No teacher found in the database. Progress tracking will not be enabled for this subject.');
    return subject;
  }

  const progress = new Progress({
    subject: subject._id,
    teacher: teacher._id,
    totalChapters: subjectData.chapters?.length || 0,
    completedChapters: 0,
    totalTopics: 0, // This should be calculated when chapters/topics are added
    completedTopics: 0,
    percentageComplete: 0,
    isOnTrack: true,
  });
  await progress.save();

  return subject;
};

export const createChapter = async (subjectId: string, chapterData: Partial<IChapter>): Promise<IChapter> => {
  const chapter = new Chapter(chapterData);
  await chapter.save();
  await Subject.findByIdAndUpdate(subjectId, { $push: { chapters: chapter._id } });
  
  // Update Progress
  const progress = await Progress.findOne({ subject: subjectId });
  if (progress) {
    progress.totalChapters += 1;
    await progress.save();
  }

  return chapter;
};

export const createTopic = async (chapterId: string, topicData: Partial<ITopic>): Promise<ITopic> => {
  const topic = new Topic(topicData);
  await topic.save();
  await Chapter.findByIdAndUpdate(chapterId, { $push: { topics: topic._id } });

  // Update Progress
  const chapter = await Chapter.findById(chapterId);
  if(chapter){
    const subject = await Subject.findOne({ chapters: chapter._id });
    if(subject){
      const progress = await Progress.findOne({ subject: subject._id });
      if (progress) {
        progress.totalTopics += 1;
        await progress.save();
      }
    }
  }

  return topic;
};

export const toggleTopicCompletion = async (topicId: string): Promise<ITopic | null> => {
    const topic = await Topic.findById(topicId);
    if (!topic) return null;

    topic.completed = !topic.completed;
    if (topic.completed) {
        topic.completedAt = new Date();
    } else {
        topic.completedAt = null;
    }
    
    await topic.save();

    const chapter = await Chapter.findOne({ topics: topicId });
    if (chapter) {
        const subject = await Subject.findOne({ chapters: chapter._id }).populate({
          path: 'chapters',
          populate: 'topics'
        });
        if (subject) {
            const progress = await Progress.findOne({ subject: subject._id });
            if (progress) {
                let completedTopics = 0;
                subject.chapters.forEach(chap => {
                  const c = chap as any;
                  completedTopics += c.topics.filter((t: any) => t.completed).length;
                });
                
                progress.completedTopics = completedTopics;
                if(progress.totalTopics > 0) {
                    progress.percentageComplete = (completedTopics / progress.totalTopics) * 100;
                } else {
                    progress.percentageComplete = 0;
                }
                progress.lastUpdated = new Date();
                await progress.save();
            }
        }
    }

    return topic;
};

export const updateSubject = async (subjectId: string, update: Partial<ISubject>) => {
  return Subject.findByIdAndUpdate(subjectId, update, { new: true });
};

export const deleteSubject = async (subjectId: string) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) return;

  const chapters = await Chapter.find({ _id: { $in: subject.chapters } });
  for (const chapter of chapters) {
    await Topic.deleteMany({ _id: { $in: chapter.topics } });
  }
  await Chapter.deleteMany({ _id: { $in: subject.chapters } });
  await Progress.deleteMany({ subject: subject._id });
  await Task.deleteMany({ subject: subject._id });

  await Subject.findByIdAndDelete(subjectId);
};

export const updateChapter = async (chapterId: string, update: Partial<IChapter>) => {
  return Chapter.findByIdAndUpdate(chapterId, update, { new: true });
};

export const deleteChapter = async (chapterId: string) => {
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) return;

  const topics = await Topic.find({ _id: { $in: chapter.topics }});
  const topicTitles = topics.map(t => t.title);

  const subject = await Subject.findOne({ chapters: chapterId });
  if (subject) {
    await Task.deleteMany({ subject: subject._id, title: { $in: topicTitles } });
    
    // Also clean up any orphaned tasks that might exist
    await cleanupOrphanedTasksForSubject(subject._id);
    
    const progress = await Progress.findOne({ subject: subject._id });
    if(progress){
        progress.totalTopics -= topics.length;
        if(progress.totalTopics < 0) progress.totalTopics = 0;
        progress.totalChapters -=1;
        if(progress.totalChapters < 0) progress.totalChapters = 0;
        await progress.save();
    }
  }

  await Topic.deleteMany({ _id: { $in: chapter.topics } });
  await Chapter.findByIdAndDelete(chapterId);
  await Subject.updateMany({ chapters: chapterId }, { $pull: { chapters: chapterId } });
};

export const updateTopic = async (topicId: string, update: Partial<ITopic>) => {
  return Topic.findByIdAndUpdate(topicId, update, { new: true });
};

export const deleteTopic = async (topicId: string) => {
  const topic = await Topic.findById(topicId);
  if (!topic) return;

  const chapter = await Chapter.findOne({ topics: topicId });
  if (chapter) {
    const subject = await Subject.findOne({ chapters: chapter._id });
    if (subject) {
      // Delete all tasks with this topic title for this subject
      await Task.deleteMany({ subject: subject._id, title: topic.title });
      
      // Also clean up any orphaned tasks that might exist
      await cleanupOrphanedTasksForSubject(subject._id);
      
      const progress = await Progress.findOne({ subject: subject._id });
      if(progress){
          progress.totalTopics -= 1;
          if(progress.totalTopics < 0) progress.totalTopics = 0;
          await progress.save();
      }
    }
  }

  await Topic.findByIdAndDelete(topicId);
  await Chapter.updateMany({ topics: topicId }, { $pull: { topics: topicId } });
};

// Helper function to clean up orphaned tasks for a specific subject
const cleanupOrphanedTasksForSubject = async (subjectId: string) => {
  const subject = await Subject.findById(subjectId).populate({
    path: 'chapters',
    populate: { path: 'topics' }
  });
  
  if (!subject) return;

  // Get all valid topic titles for this subject
  const validTopicTitles = new Set<string>();
  if (subject.chapters) {
    for (const chapter of subject.chapters as any[]) {
      if (chapter.topics) {
        for (const topic of chapter.topics) {
          validTopicTitles.add(topic.title);
        }
      }
    }
  }

  // Find all tasks for this subject
  const subjectTasks = await Task.find({ subject: subjectId });
  
  // Delete tasks that don't have valid topic titles
  for (const task of subjectTasks) {
    if (!validTopicTitles.has(task.title)) {
      await Task.findByIdAndDelete(task._id);
    }
  }
};

