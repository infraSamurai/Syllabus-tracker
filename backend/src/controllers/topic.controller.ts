import { Request, Response } from 'express';
import Topic from '../models/Topic';

export const toggleTopicCompletion = async (req: Request, res: Response) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    topic.completed = !topic.completed;
    topic.completedAt = topic.completed ? new Date() : null;
    await topic.save();
    res.json(topic);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// ...other topic controller methods... 