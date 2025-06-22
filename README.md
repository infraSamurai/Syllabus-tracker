# Syllabus Tracker - Management System

A comprehensive full-stack application for managing educational syllabi, tracking progress, and generating reports for schools and educational institutions.

## 🚀 Features

### Core Functionality
- **Subject Management**: Create and manage subjects with chapters and topics
- **Class Management**: Organize subjects by classes/grade levels
- **Progress Tracking**: Real-time progress monitoring with visual indicators
- **Dashboard**: Bird's-eye view of all subjects and their completion status

### Priority Features (Newly Added)
- **📊 Weekly/Monthly Reports**: Comprehensive analytics and insights
  - Teacher-wise completion status
  - Topics covered vs planned
  - Class-wise progress summary
  - Upcoming deadlines alerts
  - Department-wise analytics
  - Teacher performance metrics
  - Syllabus completion projections
  - Areas needing attention

- **📋 Daily Task Management**: Structured daily planning for teachers
  - Automatic task generation from syllabus
  - Daily teaching checklist
  - Priority-based task sorting
  - Quick completion marking
  - Notes/observations for each class
  - Tomorrow's preparation reminders

### Technical Features
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live progress tracking and status updates
- **Visual Indicators**: Color-coded progress bars and status indicators
- **Modern UI/UX**: Clean, intuitive interface with smooth animations

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js** framework
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **Docker** containerization

### Frontend
- **Vanilla JavaScript** (ES6+)
- **HTML5** with semantic markup
- **CSS3** with modern features (Grid, Flexbox, Custom Properties)
- **Nginx** for static file serving and API proxying

## 📁 Project Structure

```
Syllabus-tracker/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration files
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html          # Main application
│   ├── script.js           # Application logic
│   ├── style.css           # Styling
│   ├── nginx.conf          # Nginx configuration
│   └── Dockerfile
├── docker-compose.yml      # Multi-container setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

### Running with Docker
```bash
# Clone the repository
git clone <repository-url>
cd Syllabus-tracker

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5001
# MongoDB: localhost:27017
```

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
# Serve with any static file server
python -m http.server 8000
# or
npx serve .
```

## 📊 API Endpoints

### Core Endpoints
- `GET /api/syllabus/subjects` - Get all subjects
- `POST /api/syllabus/subjects` - Create new subject
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class

### New Report Endpoints
- `GET /api/reports/weekly` - Generate weekly report
- `GET /api/reports/monthly` - Generate monthly report

### New Task Endpoints
- `POST /api/tasks/generate` - Generate daily tasks
- `GET /api/tasks` - Get tasks (with date filtering)
- `PATCH /api/tasks/:id/complete` - Mark task complete
- `PATCH /api/tasks/:id/note` - Add note to task

## 🎯 Usage Guide

### 1. Getting Started
1. Access the application at `http://localhost:3000`
2. Start by adding classes in the "Manage Classes" tab
3. Add subjects and assign them to classes
4. Create chapters and topics for each subject

### 2. Daily Task Management
1. Navigate to the "Daily Tasks" tab
2. Click "Generate Tasks" to create tasks from your syllabus
3. Use the date picker to view tasks for specific dates
4. Mark tasks as complete and add notes as needed

### 3. Reports & Analytics
1. Go to the "Reports" tab
2. Click "Weekly Report" for current week insights
3. Click "Monthly Report" for comprehensive monthly analytics
4. Review teacher performance, department progress, and areas needing attention

### 4. Progress Tracking
1. Use the "Progress Tracking" tab for detailed progress views
2. Monitor completion rates across all subjects
3. Identify overdue topics and areas requiring attention

## 🔧 Configuration

### Environment Variables
```env
# Backend (.env)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/syllabus_tracker?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Built with ❤️ for educational institutions**
