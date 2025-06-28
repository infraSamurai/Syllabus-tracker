import { Request, Response, NextFunction } from 'express';
import { ProgressCalculationService } from '../services/progressCalculation.service';

const progressService = new ProgressCalculationService();

export const progressCalculationMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Only run for specific routes that modify syllabus data
  const triggerPaths = [
    '/api/syllabus/topics',
    '/api/syllabus/chapters',
    '/api/kpis'
  ];
  
  const shouldCalculate = triggerPaths.some(path => 
    req.path.includes(path) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  );
  
  if (!shouldCalculate) {
    return next();
  }
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send function
  res.send = function(data: any): Response {
    // After successful response, calculate progress asynchronously
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Extract subject ID from request or response
      const subjectId = extractSubjectId(req, data);
      
      if (subjectId) {
        // Don't wait for this to complete
        progressService.calculateAndUpdateProgress(subjectId)
          .catch((err: any) => console.error('Error calculating progress:', err));
      }
    }
    
    // Call original send
    return originalSend.call(this, data);
  };
  
  next();
};

function extractSubjectId(req: Request, responseData: any): string | null {
  // Try to get subject ID from various sources
  if (req.body?.subject) return req.body.subject;
  if (req.params?.subjectId) return req.params.subjectId;
  
  // Parse response data if it's a string
  try {
    const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    if (data?.subject?._id) return data.subject._id;
    if (data?.subject) return data.subject;
  } catch (e) {
    // Ignore parsing errors
  }
  
  return null;
} 