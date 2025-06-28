import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import Topic from '../models/Topic';
import Task from '../models/Task';
import Progress from '../models/Progress';
import { pdfService } from './pdf.service';

export class ExportService {
  async generateWeeklyReport(format: string, filters?: any): Promise<Buffer> {
    const data = await this.getWeeklyReportData(filters);
    
    switch (format) {
      case 'excel':
        return this.generateExcelReport(data, 'Weekly Report');
      case 'csv':
        return this.generateCSVReport(data);
      case 'pdf':
        return pdfService.generateWeeklyReport();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async generateMonthlyReport(format: string, filters?: any): Promise<Buffer> {
    const data = await this.getMonthlyReportData(filters);
    
    switch (format) {
      case 'excel':
        return this.generateExcelReport(data, 'Monthly Report');
      case 'csv':
        return this.generateCSVReport(data);
      case 'pdf':
        return pdfService.generateMonthlyReport();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async generateDailyReport(format: string, filters?: any): Promise<Buffer> {
    const data = await this.getDailyReportData(filters);
    
    switch (format) {
      case 'excel':
        return this.generateExcelReport(data, 'Daily Report');
      case 'csv':
        return this.generateCSVReport(data);
      case 'pdf':
        return pdfService.generateDailyTaskPDF(new Date().toISOString().split('T')[0]);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async getWeeklyReportData(filters?: any) {
    const [startOfWeek, endOfWeek] = this.getWeekRange();
    
    // Build query based on filters
    const subjectQuery: any = {};
    if (filters?.departments?.length > 0) {
      subjectQuery.department = { $in: filters.departments };
    }
    if (filters?.classes?.length > 0) {
      subjectQuery.class = { $in: filters.classes };
    }
    if (filters?.subjects?.length > 0) {
      subjectQuery._id = { $in: filters.subjects };
    }

    const subjects = await Subject.find(subjectQuery)
      .populate('class')
      .populate({
        path: 'chapters',
        populate: { path: 'topics' }
      });

    const tasks = await Task.find({
      date: { $gte: startOfWeek, $lte: endOfWeek }
    }).populate('subject').populate('class');

    const progress = await Progress.find({
      subject: { $in: subjects.map(s => s._id) }
    }).populate('subject').populate('teacher');

    // Transform data for export
    const reportData: any[] = [];
    
    for (const subject of subjects) {
      const subjectProgress = progress.find(p => p.subject._id.toString() === subject._id.toString());
      const subjectTasks = tasks.filter(t => t.subject?._id.toString() === subject._id.toString());
      
      let totalTopics = 0;
      let completedTopics = 0;
      let overdueTopics = 0;
      
      for (const chapter of subject.chapters as any[]) {
        totalTopics += chapter.topics.length;
        for (const topic of chapter.topics) {
          if (topic.completed) completedTopics++;
          if (!topic.completed && new Date(topic.deadline) < new Date()) {
            overdueTopics++;
          }
        }
      }
      
      reportData.push({
        'Subject': subject.name,
        'Code': subject.code,
        'Class': (subject.class as any)?.name || 'N/A',
        'Department': subject.department,
        'Total Topics': totalTopics,
        'Completed Topics': completedTopics,
        'Overdue Topics': overdueTopics,
        'Progress %': subjectProgress?.percentageComplete || 0,
        'Tasks This Week': subjectTasks.length,
        'Tasks Completed': subjectTasks.filter(t => t.completed).length
      });
    }
    
    return reportData;
  }

  private async getMonthlyReportData(filters?: any) {
    const [startOfMonth, endOfMonth] = this.getMonthRange();
    
    // Similar to weekly but with monthly data
    const subjectQuery: any = {};
    if (filters?.departments?.length > 0) {
      subjectQuery.department = { $in: filters.departments };
    }
    if (filters?.classes?.length > 0) {
      subjectQuery.class = { $in: filters.classes };
    }
    if (filters?.subjects?.length > 0) {
      subjectQuery._id = { $in: filters.subjects };
    }

    const subjects = await Subject.find(subjectQuery)
      .populate('class')
      .populate({
        path: 'chapters',
        populate: { path: 'topics' }
      });

    const reportData: any[] = [];
    
    for (const subject of subjects) {
      const chapters = subject.chapters as any[];
      let monthlyCompleted = 0;
      let totalTopics = 0;
      let completedTopics = 0;
      
      for (const chapter of chapters) {
        totalTopics += chapter.topics.length;
        for (const topic of chapter.topics) {
          if (topic.completed) {
            completedTopics++;
            if (topic.completedAt >= startOfMonth && topic.completedAt <= endOfMonth) {
              monthlyCompleted++;
            }
          }
        }
      }
      
      reportData.push({
        'Subject': subject.name,
        'Code': subject.code,
        'Class': (subject.class as any)?.name || 'N/A',
        'Department': subject.department,
        'Total Topics': totalTopics,
        'Overall Completed': completedTopics,
        'Completed This Month': monthlyCompleted,
        'Overall Progress %': totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        'Deadline': new Date(subject.deadline).toLocaleDateString()
      });
    }
    
    return reportData;
  }

  private async getDailyReportData(filters?: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskQuery: any = { date: { $gte: today, $lt: tomorrow } };
    if (filters?.classes?.length > 0) {
      taskQuery.class = { $in: filters.classes };
    }
    if (filters?.subjects?.length > 0) {
      taskQuery.subject = { $in: filters.subjects };
    }
    
    const tasks = await Task.find(taskQuery)
      .populate('subject')
      .populate('class')
      .populate('teacher');
    
    const reportData = tasks.map(task => ({
      'Title': task.title,
      'Subject': (task.subject as any)?.name || 'N/A',
      'Class': (task.class as any)?.name || 'N/A',
      'Teacher': (task.teacher as any)?.name || 'Unassigned',
      'Priority': task.priority,
      'Status': task.completed ? 'Completed' : 'Pending',
      'Notes': task.notes || ''
    }));
    
    return reportData;
  }

  private async generateExcelReport(data: any[], title: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);
    
    // Add title
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = title;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Add generation date
    worksheet.mergeCells('A2:J2');
    const now: Date = new Date();
    worksheet.getCell('A2').value = `Generated on: ${(now.toLocaleString as Function).call(now)}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Add headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow([]);
      worksheet.addRow(headers);
      
      // Style headers
      const headerRow = worksheet.getRow(4);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
      };
      headerRow.font.color = { argb: 'FFFFFFFF' };
      
      // Add data
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
      
      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        if (!column) return;
        let maxLength = 0;
        (column as any).eachCell({ includeEmpty: true }, (cell: any) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private generateCSVReport(data: any[]): Buffer {
    if (data.length === 0) {
      return Buffer.from('No data available');
    }
    
    const fields = Object.keys(data[0]);
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);
    
    return Buffer.from(csv);
  }

  private getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return [monday, sunday];
  }

  private getMonthRange(date = new Date()) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return [start, end];
  }
}

export const exportService = new ExportService(); 