import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs-extra';
import * as path from 'path';
import Subject from '../models/Subject';
import Task from '../models/Task';
import { Progress } from '../models/Progress';

interface DepartmentStats {
  count: number;
  totalTopics: number;
  completedTopics: number;
}

export class PDFService {
  private templatePath = '/app/frontend/aps-letterhead.pdf';

  async generateWeeklyReport(): Promise<Buffer> {
    try {
      // Load the letterhead template
      const templateBytes = await fs.readFile(this.templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      // Get the first page
      const pages = pdfDoc.getPages();
      const page = pages[0];
      
      // Get font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Page dimensions
      const { width, height } = page.getSize();
      
      // Add title
      page.drawText('WEEKLY SYLLABUS PROGRESS REPORT', {
        x: 50,
        y: height - 150,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      // Add date
      const currentDate = new Date().toLocaleDateString();
      page.drawText(`Generated on: ${currentDate}`, {
        x: 50,
        y: height - 180,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      // Get data
      const subjects = await Subject.find().populate('class').populate({
        path: 'chapters',
        populate: { path: 'topics' }
      });
      
      let yPosition = height - 220;
      
      // Summary section
      page.drawText('EXECUTIVE SUMMARY', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 30;
      
      const totalSubjects = subjects.length;
      let totalTopics = 0;
      let completedTopics = 0;
      
      subjects.forEach(subject => {
        subject.chapters.forEach((chapter: any) => {
          totalTopics += chapter.topics.length;
          completedTopics += chapter.topics.filter((topic: any) => topic.completed).length;
        });
      });
      
      const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
      
      page.drawText(`Total Subjects: ${totalSubjects}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Total Topics: ${totalTopics}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Completed Topics: ${completedTopics}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Overall Progress: ${Math.round(overallProgress)}%`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 40;
      
      // Subject-wise breakdown
      page.drawText('SUBJECT-WISE PROGRESS', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 30;
      
      for (const subject of subjects) {
        if (yPosition < 100) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([width, height]);
          yPosition = height - 50;
        }
        
        const subjectTopics = subject.chapters.reduce((sum: number, chapter: any) => 
          sum + chapter.topics.length, 0);
        const subjectCompleted = subject.chapters.reduce((sum: number, chapter: any) => 
          sum + chapter.topics.filter((topic: any) => topic.completed).length, 0);
        const subjectProgress = subjectTopics > 0 ? (subjectCompleted / subjectTopics) * 100 : 0;
        
        const className = typeof subject.class === 'object' && subject.class !== null && 'name' in subject.class 
          ? (subject.class as any).name : 'Unknown Class';
        
        page.drawText(`${subject.name} (${subject.code}) - ${className}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= 20;
        
        page.drawText(`Progress: ${subjectCompleted}/${subjectTopics} topics (${Math.round(subjectProgress)}%)`, {
          x: 70,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= 25;
      }
      
      // Convert to buffer
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('Error generating weekly PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }
  
  async generateMonthlyReport(): Promise<Buffer> {
    try {
      // Load the letterhead template
      const templateBytes = await fs.readFile(this.templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      // Get the first page
      const pages = pdfDoc.getPages();
      const page = pages[0];
      
      // Get font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Page dimensions
      const { width, height } = page.getSize();
      
      // Add title
      page.drawText('MONTHLY SYLLABUS PROGRESS REPORT', {
        x: 50,
        y: height - 150,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      // Add date
      const currentDate = new Date().toLocaleDateString();
      page.drawText(`Generated on: ${currentDate}`, {
        x: 50,
        y: height - 180,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      // Get data
      const subjects = await Subject.find().populate('class').populate({
        path: 'chapters',
        populate: { path: 'topics' }
      });
      
      const tasks = await Task.find().populate('subject').populate('class');
      
      let yPosition = height - 220;
      
      // Summary section
      page.drawText('MONTHLY EXECUTIVE SUMMARY', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 30;
      
      const totalSubjects = subjects.length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      
      page.drawText(`Total Subjects: ${totalSubjects}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Total Tasks Generated: ${totalTasks}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Completed Tasks: ${completedTasks}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 20;
      
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      page.drawText(`Task Completion Rate: ${Math.round(taskCompletionRate)}%`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 40;
      
      // Department analysis
      page.drawText('DEPARTMENT ANALYSIS', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 30;
      
      // Group subjects by department
      const departmentStats: Record<string, DepartmentStats> = subjects.reduce((acc: Record<string, DepartmentStats>, subject) => {
        const dept = subject.department || 'General';
        if (!acc[dept]) {
          acc[dept] = { count: 0, totalTopics: 0, completedTopics: 0 };
        }
        acc[dept].count++;
        
        subject.chapters.forEach((chapter: any) => {
          acc[dept].totalTopics += chapter.topics.length;
          acc[dept].completedTopics += chapter.topics.filter((topic: any) => topic.completed).length;
        });
        
        return acc;
      }, {});
      
      for (const [dept, stats] of Object.entries(departmentStats)) {
        if (yPosition < 100) {
          const newPage = pdfDoc.addPage([width, height]);
          yPosition = height - 50;
        }
        
        const deptProgress = stats.totalTopics > 0 ? (stats.completedTopics / stats.totalTopics) * 100 : 0;
        
        page.drawText(`${dept} Department`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= 20;
        
        page.drawText(`Subjects: ${stats.count} | Progress: ${Math.round(deptProgress)}%`, {
          x: 70,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= 25;
      }
      
      // Convert to buffer
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('Error generating monthly PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  async generateDailyTaskPDF(date: string): Promise<Buffer> {
    try {
      let pdfDoc: PDFDocument;
      
      // Try to load the letterhead template, fallback to new document if not found
      try {
        const templateBytes = await fs.readFile(this.templatePath);
        pdfDoc = await PDFDocument.load(templateBytes);
      } catch (templateError) {
        console.warn('Template file not found, creating new PDF document:', templateError);
        pdfDoc = await PDFDocument.create();
      }
      
      // Get the first page (or create one if using new document)
      let page;
      const pages = pdfDoc.getPages();
      if (pages.length > 0) {
        page = pages[0];
      } else {
        page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      }
      
      // Get font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Page dimensions
      const { width, height } = page.getSize();
      
      // Add title
      page.drawText('DAILY TASK REPORT', {
        x: 50,
        y: height - 150,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      // Add date
      const reportDate = new Date(date).toLocaleDateString();
      page.drawText(`Date: ${reportDate}`, {
        x: 50,
        y: height - 180,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      // Add generation timestamp
      const currentDate = new Date().toLocaleDateString();
      page.drawText(`Generated on: ${currentDate}`, {
        x: 50,
        y: height - 200,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Get tasks for the specified date
      const taskDate = new Date(date);
      taskDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(taskDate);
      nextDay.setDate(taskDate.getDate() + 1);
      
      const tasks = await Task.find({
        date: { $gte: taskDate, $lt: nextDay }
      }).populate('subject').populate('class');
      
      let yPosition = height - 240;
      
      // Summary section
      page.drawText('TASK SUMMARY', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 30;
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const pendingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      page.drawText(`Total Tasks: ${totalTasks}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Completed: ${completedTasks}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0.6, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Pending: ${pendingTasks}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0.8, 0.4, 0)
      });
      
      yPosition -= 20;
      
      page.drawText(`Completion Rate: ${Math.round(completionRate)}%`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 40;
      
      // Task details section
      page.drawText('TASK DETAILS', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 30;
      
      if (tasks.length === 0) {
        page.drawText('No tasks scheduled for this date.', {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0.5, 0.5, 0.5)
        });
      } else {
        // Group tasks by priority
        const highPriorityTasks = tasks.filter(task => task.priority === 'high');
        const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium');
        const lowPriorityTasks = tasks.filter(task => task.priority === 'low');
        
        // High Priority Tasks
        if (highPriorityTasks.length > 0) {
          page.drawText('HIGH PRIORITY', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0.8, 0, 0)
          });
          
          yPosition -= 25;
          
          for (const task of highPriorityTasks) {
            if (yPosition < 100) {
              const newPage = pdfDoc.addPage([width, height]);
              yPosition = height - 50;
            }
            
            const status = task.completed ? 'COMPLETED' : 'PENDING';
            const statusColor = task.completed ? rgb(0, 0.6, 0) : rgb(0.8, 0.4, 0);
            
            const subjectName = task.subject && typeof task.subject === 'object' && 'name' in task.subject 
              ? (task.subject as any).name : 'Unknown Subject';
            const className = task.class && typeof task.class === 'object' && 'name' in task.class 
              ? (task.class as any).name : 'Unknown Class';
            
            page.drawText(`• ${task.title}`, {
              x: 70,
              y: yPosition,
              size: 11,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
            
            yPosition -= 18;
            
            page.drawText(`  Subject: ${subjectName} | Class: ${className}`, {
              x: 70,
              y: yPosition,
              size: 9,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
            
            yPosition -= 15;
            
            page.drawText(`  Status: ${status}`, {
              x: 70,
              y: yPosition,
              size: 9,
              font: font,
              color: statusColor
            });
            
            yPosition -= 20;
          }
        }
        
        // Medium Priority Tasks
        if (mediumPriorityTasks.length > 0) {
          if (yPosition < 120) {
            const newPage = pdfDoc.addPage([width, height]);
            yPosition = height - 50;
          }
          
          page.drawText('MEDIUM PRIORITY', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0.8, 0.6, 0)
          });
          
          yPosition -= 25;
          
          for (const task of mediumPriorityTasks) {
            if (yPosition < 100) {
              const newPage = pdfDoc.addPage([width, height]);
              yPosition = height - 50;
            }
            
            const status = task.completed ? 'COMPLETED' : 'PENDING';
            const statusColor = task.completed ? rgb(0, 0.6, 0) : rgb(0.8, 0.4, 0);
            
            const subjectName = task.subject && typeof task.subject === 'object' && 'name' in task.subject 
              ? (task.subject as any).name : 'Unknown Subject';
            const className = task.class && typeof task.class === 'object' && 'name' in task.class 
              ? (task.class as any).name : 'Unknown Class';
            
            page.drawText(`• ${task.title}`, {
              x: 70,
              y: yPosition,
              size: 11,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
            
            yPosition -= 18;
            
            page.drawText(`  Subject: ${subjectName} | Class: ${className}`, {
              x: 70,
              y: yPosition,
              size: 9,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
            
            yPosition -= 15;
            
            page.drawText(`  Status: ${status}`, {
              x: 70,
              y: yPosition,
              size: 9,
              font: font,
              color: statusColor
            });
            
            yPosition -= 20;
          }
        }
        
        // Low Priority Tasks
        if (lowPriorityTasks.length > 0) {
          if (yPosition < 120) {
            const newPage = pdfDoc.addPage([width, height]);
            yPosition = height - 50;
          }
          
          page.drawText('LOW PRIORITY', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0, 0.6, 0)
          });
          
          yPosition -= 25;
          
          for (const task of lowPriorityTasks) {
            if (yPosition < 100) {
              const newPage = pdfDoc.addPage([width, height]);
              yPosition = height - 50;
            }
            
            const status = task.completed ? 'COMPLETED' : 'PENDING';
            const statusColor = task.completed ? rgb(0, 0.6, 0) : rgb(0.8, 0.4, 0);
            
            const subjectName = task.subject && typeof task.subject === 'object' && 'name' in task.subject 
              ? (task.subject as any).name : 'Unknown Subject';
            const className = task.class && typeof task.class === 'object' && 'name' in task.class 
              ? (task.class as any).name : 'Unknown Class';
            
            page.drawText(`• ${task.title}`, {
              x: 70,
              y: yPosition,
              size: 11,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
            
            yPosition -= 18;
            
            page.drawText(`  Subject: ${subjectName} | Class: ${className}`, {
              x: 70,
              y: yPosition,
              size: 9,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
            
            yPosition -= 15;
            
            page.drawText(`  Status: ${status}`, {
              x: 70,
              y: yPosition,
              size: 9,
              font: font,
              color: statusColor
            });
            
            yPosition -= 20;
          }
        }
      }
      
      // Convert to buffer
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('Error generating daily task PDF:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        date: date
      });
      throw new Error('Failed to generate daily task PDF report');
    }
  }
}

export const pdfService = new PDFService(); 