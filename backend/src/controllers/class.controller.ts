import { Request, Response, NextFunction } from 'express';
import * as classService from '../services/class.service';

export const getClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await classService.getClasses();
    res.json(classes);
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newClass = await classService.createClass(req.body);
    res.status(201).json(newClass);
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedClass = await classService.updateClass(req.params.id, req.body);
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(updatedClass);
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await classService.deleteClass(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}; 