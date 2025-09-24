📊 AI Content Quality Evaluation & Annotation Dashboard
License: MITPythonReactFastAPIMongoDBPRs Welcome

A comprehensive, professional-grade annotation dashboard for evaluating AI-generated text quality with advanced analytics, pairwise comparisons, and seamless data management.

🌟 Overview
This platform provides researchers, data scientists, and AI practitioners with a powerful tool to systematically evaluate and annotate AI-generated text content. Built with modern web technologies, it offers an intuitive interface for quality assessment, comparative analysis, and dataset management.

✨ Key Features
🎯 Single Text Annotation
Quality Assessment: Comprehensive Good/Average/Poor rating system
Issue Tagging: Multi-select categorization (Grammar, Relevance, Safety, Completeness)
Rich Notes: Detailed feedback and observations
Auto-progression: Seamless workflow through sample datasets
Progress Tracking: Visual progress indicators and completion statistics
⚖️ Pairwise Comparison Interface
Side-by-side Analysis: Clean, distraction-free comparison layout
Random Sampling: Unbiased text pair selection for evaluation
Topic Categorization: Contextual badges for content classification
Quick Selection: One-click better text identification
Unlimited Pairs: Generate new comparisons on-demand
📊 Advanced Analytics Dashboard
Real-time Statistics: Live tracking of annotation progress
Quality Distribution: Visual breakdown of assessment results
Inter-annotator Metrics: Agreement tracking for team projects
Export Analytics: Comprehensive reporting capabilities
📤 Data Import/Export System
Flexible Upload: CSV and JSON format support
Bulk Processing: Handle large datasets efficiently
Format Validation: Automatic data structure verification
Multiple Export Options: Annotations-only or complete dataset exports
Professional CSV Output: Ready for analysis and model training
🎨 Professional UI/UX
Modern Design: Clean, intuitive interface built with Shadcn/UI
Responsive Layout: Seamless experience across devices
Accessibility Features: WCAG compliant with keyboard navigation
Performance Optimized: Fast loading and smooth interactions
Toast Notifications: Real-time feedback for all user actions
🏗️ Tech Stack
Backend
FastAPI - High-performance Python web framework
MongoDB - Flexible NoSQL database for scalable data storage
Motor - Async MongoDB driver for optimal performance
Pydantic - Data validation and serialization
Uvicorn - Lightning-fast ASGI server
Frontend
React 19 - Modern UI library with latest features
TypeScript - Type-safe JavaScript development
Tailwind CSS - Utility-first CSS framework
Shadcn/UI - High-quality, accessible component library
Axios - Promise-based HTTP client
React Router - Declarative routing
Development & Deployment
Python Virtual Environment - Isolated dependency management
ESLint & Prettier - Code quality and formatting
Hot Reload - Instant development feedback
CORS Configuration - Secure cross-origin resource sharing
🚀 Quick Start
Prerequisites
Ensure you have the following installed:

Python 3.9+ (Download)
Node.js 18+ (Download)
MongoDB Community Edition (Download)
Git (Download)
Installation
Clone the repository

git clone https://github.com/yourusername/ai-content-evaluation-dashboard.git
cd ai-content-evaluation-dashboard
Backend Setup

cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
Frontend Setup

cd ../frontend
npm install
# or
yarn install
Environment Configuration

Create backend/.env:

MONGO_URL=mongodb://localhost:27017
DB_NAME=ai_content_evaluation
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
Create frontend/.env:

REACT_APP_BACKEND_URL=http://localhost:8001
Running the Application
Start MongoDB

mongod
Start Backend Server

cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001
Start Frontend Development Server

cd frontend
npm start
Access the Application

Frontend: http://localhost:3000
API Documentation: http://localhost:8001/docs
API Health Check: http://localhost:8001/api/
📚 Usage Guide
Getting Started
Initialize Sample Data: Click "Initialize Sample Data" to load 15+ diverse text samples
Navigate Tabs: Use the tab interface to access different features
Start Annotating: Select quality levels, add issue tags, and include notes
Compare Texts: Use pairwise comparison for relative quality assessment
Export Results: Download your annotations in CSV format for analysis
Annotation Workflow
📝 Select Text Sample → 🏷️ Choose Quality Level → ✅ Add Issue Tags → 📋 Write Notes → 💾 Submit → ➡️ Next Sample
Data Management
Upload CSV: Format with text, source, topic columns
Upload JSON: Array of objects with text properties
Export Options: Choose between annotations-only or full dataset
Progress Tracking: Monitor annotation completion in real-time
🔧 API Documentation
Core Endpoints
Method	Endpoint	Description
GET	/api/text-samples	Retrieve all text samples
POST	/api/text-samples	Create new text sample
POST	/api/annotations	Submit annotation
GET	/api/random-pair	Get random text pair for comparison
POST	/api/pairwise-comparisons	Submit comparison result
GET	/api/analytics/summary	Get annotation statistics
GET	/api/export/annotations-csv	Export annotations as CSV
POST	/api/text-samples/upload-csv	Upload text samples via CSV
Sample API Request
// Submit annotation
const annotation = {
  text_sample_id: "sample-id-123",
  quality_level: "good",
  issue_tags: ["grammar_error"],
  notes: "Minor grammatical issues but overall coherent"
};

fetch('/api/annotations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(annotation)
});
📊 Sample Data
The platform includes 15+ pre-loaded sample texts covering various topics and quality levels:

High Quality: Well-structured, grammatically correct content
Medium Quality: Minor issues requiring attention
Low Quality: Significant problems for annotation practice
Topics include Technology, Health, Education, Literature, and intentionally flawed samples for training purposes.

🔒 Security Features
CORS Configuration: Secure cross-origin resource sharing
Input Validation: Comprehensive data sanitization
Error Handling: Graceful error management and user feedback
Environment Variables: Secure configuration management
🛠️ Development
Project Structure
ai-content-evaluation-dashboard/
├── 📁 backend/                 # FastAPI backend
│   ├── 🐍 server.py           # Main application
│   ├── 📋 requirements.txt    # Python dependencies
│   └── 🔐 .env               # Environment variables
├── 📁 frontend/               # React frontend
│   ├── 📁 src/
│   │   ├── ⚛️ App.js          # Main component
│   │   ├── 🎨 App.css         # Styles
│   │   └── 📁 components/ui/  # UI components
│   ├── 📦 package.json       # Node dependencies
│   └── 🔐 .env              # Environment variables
└── 📄 README.md              # This file
Code Quality
ESLint: JavaScript/TypeScript linting
Prettier: Code formatting
Type Safety: TypeScript for frontend development
API Documentation: Auto-generated with FastAPI
Component Library: Consistent UI with Shadcn/UI
Testing
# Backend tests
cd backend
python -m pytest

# Frontend tests  
cd frontend
npm test
🤝 Contributing
We welcome contributions! Please see our Contributing Guidelines for details.

Development Workflow
Fork the repository
Create feature branch: git checkout -b feature/amazing-feature
Commit changes: git commit -m 'Add amazing feature'
Push to branch: git push origin feature/amazing-feature
Open Pull Request
Areas for Contribution
🌐 Internationalization: Multi-language support
📊 Analytics: Advanced visualization features
🔐 Authentication: User management system
🎨 UI/UX: Design improvements and accessibility
⚡ Performance: Optimization and caching
📱 Mobile: Enhanced mobile experience
📈 Roadmap
Upcoming Features
 User Authentication: Multi-user support with role management
 Advanced Analytics: Machine learning insights and trends
 Real-time Collaboration: Live annotation sessions
 API Rate Limiting: Enhanced security and performance
 Docker Support: Containerized deployment
 Cloud Integration: AWS/GCP/Azure compatibility
