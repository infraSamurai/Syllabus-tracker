import Subject, { ISubject } from '../models/Subject';
import Chapter, { IChapter } from '../models/Chapter';
import Topic, { ITopic } from '../models/Topic';

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
  return subject.save();
};

export const createChapter = async (subjectId: string, chapterData: Partial<IChapter>): Promise<IChapter> => {
  const chapter = new Chapter(chapterData);
  await chapter.save();
  await Subject.findByIdAndUpdate(subjectId, { $push: { chapters: chapter._id } });
  return chapter;
};

export const createTopic = async (chapterId: string, topicData: Partial<ITopic>): Promise<ITopic> => {
  const topic = new Topic(topicData);
  await topic.save();
  await Chapter.findByIdAndUpdate(chapterId, { $push: { topics: topic._id } });
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
    return topic;
};

export const updateSubject = async (subjectId: string, update: Partial<ISubject>) => {
  return Subject.findByIdAndUpdate(subjectId, update, { new: true });
};

export const deleteSubject = async (subjectId: string) => {
  // Also delete all chapters and topics under this subject
  const subject = await Subject.findById(subjectId).populate({
    path: 'chapters',
    populate: { path: 'topics' }
  });
  if (subject) {
    for (const chapter of subject.chapters as any[]) {
      await Topic.deleteMany({ _id: { $in: chapter.topics } });
      await Chapter.findByIdAndDelete(chapter._id);
    }
  }
  return Subject.findByIdAndDelete(subjectId);
};

export const updateChapter = async (chapterId: string, update: Partial<IChapter>) => {
  return Chapter.findByIdAndUpdate(chapterId, update, { new: true });
};

export const deleteChapter = async (chapterId: string) => {
  // Also delete all topics under this chapter
  const chapter = await Chapter.findById(chapterId).populate('topics');
  if (chapter) {
    await Topic.deleteMany({ _id: { $in: chapter.topics } });
  }
  await Chapter.findByIdAndDelete(chapterId);
  // Remove from parent subject
  await Subject.updateMany({ chapters: chapterId }, { $pull: { chapters: chapterId } });
};

export const updateTopic = async (topicId: string, update: Partial<ITopic>) => {
  return Topic.findByIdAndUpdate(topicId, update, { new: true });
};

export const deleteTopic = async (topicId: string) => {
  await Topic.findByIdAndDelete(topicId);
  // Remove from parent chapter
  await Chapter.updateMany({ topics: topicId }, { $pull: { topics: topicId } });
};
