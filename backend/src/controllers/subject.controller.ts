import Subject from '../models/Subject';
import { Request, Response } from 'express';

export const getSubjectsPopulated = async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.find()
      .populate('class', 'name')
      .populate({
        path: 'chapters',
        populate: { path: 'topics' }
      });
    res.json(subjects);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json(subject);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('class', 'name')
      .populate({
        path: 'chapters',
        populate: { path: 'topics' }
      });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// ...other subject controller methods... 