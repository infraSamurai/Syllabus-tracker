import { Request, Response, NextFunction } from 'express';
import * as syllabusService from '../services/syllabus.service';

// SUBJECTS
export const getSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await syllabusService.getSubjects();
    res.status(200).json(subjects);
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subject = await syllabusService.createSubject(req.body);
    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subject = await syllabusService.updateSubject(req.params.subjectId, req.body);
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    res.json(subject);
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await syllabusService.deleteSubject(req.params.subjectId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// CHAPTERS
export const createChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, ...chapterData } = req.body;
    const chapter = await syllabusService.createChapter(subject, chapterData);
    res.status(201).json(chapter);
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chapter = await syllabusService.updateChapter(req.params.chapterId, req.body);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    res.json(chapter);
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await syllabusService.deleteChapter(req.params.chapterId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// TOPICS
export const createTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chapter, ...topicData } = req.body;
    const topic = await syllabusService.createTopic(chapter, topicData);
    res.status(201).json(topic);
  } catch (error) {
    next(error);
  }
};

export const updateTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = await syllabusService.updateTopic(req.params.topicId, req.body);
    if (!topic) return res.status(404).json({ message: 'Topic not found.' });
    res.json(topic);
  } catch (error) {
    next(error);
  }
};

export const deleteTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await syllabusService.deleteTopic(req.params.topicId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// TOPIC COMPLETION
export const toggleTopicCompletion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topicId } = req.params;
    const topic = await syllabusService.toggleTopicCompletion(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }
    res.status(200).json(topic);
  } catch (error) {
    next(error);
  }
};
