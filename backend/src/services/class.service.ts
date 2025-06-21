import Class, { IClass } from '../models/Class';

export const getClasses = async (): Promise<IClass[]> => {
  return Class.find().sort({ name: 1 });
};

export const createClass = async (data: Partial<IClass>): Promise<IClass> => {
  const newClass = new Class(data);
  return newClass.save();
};

export const updateClass = async (id: string, data: Partial<IClass>): Promise<IClass | null> => {
  return Class.findByIdAndUpdate(id, data, { new: true });
};

export const deleteClass = async (id: string): Promise<void> => {
  await Class.findByIdAndDelete(id);
}; 