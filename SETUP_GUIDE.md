# 🚀 InsightMate Setup Guide

Welcome to InsightMate - Your Autonomous Data Analyst! This guide will help you set up and run the platform on your local machine.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

## 🛠️ Quick Start (Recommended)

The easiest way to get started is using our automated startup script:

```bash
# Make the script executable (if not already)
chmod +x start.sh

# Run the startup script
./start.sh
```

This script will:
1. ✅ Check all prerequisites
2. 📦 Install all dependencies
3. 🔧 Start the backend server
4. 🎨 Start the frontend server
5. 🌐 Open the application in your browser

## 🔧 Manual Setup

If you prefer to set up manually or the automated script doesn't work:

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create uploads directory:**
   ```bash
   mkdir -p uploads
   ```

5. **Start the backend server:**
   ```bash
   python main.py
   ```

   The backend will be available at: http://localhost:8000
   API documentation: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will be available at: http://localhost:3000

## 🎯 Usage

Once both servers are running:

1. **Open your browser** and go to http://localhost:3000
2. **Upload your data file** (CSV, Excel, JSON, Parquet)
3. **Let AI clean and analyze** your data automatically
4. **Explore interactive dashboards** and insights
5. **Ask questions** using the conversational AI interface

## 📊 Supported File Formats

- **CSV** (.csv) - Comma-separated values
- **Excel** (.xlsx, .xls) - Microsoft Excel files
- **JSON** (.json) - JavaScript Object Notation
- **Parquet** (.parquet) - Columnar storage format

## 🔍 Features

### 🤖 AI-Powered Data Cleaning
- Automatic detection of missing values
- Outlier detection and handling
- Data type inference and conversion
- Duplicate removal
- Inconsistent value standardization

### 📈 Intelligent Analysis
- Trend detection in time series data
- Correlation analysis between variables
- Anomaly detection using statistical methods
- Pattern recognition and clustering
- Distribution analysis

### 📊 Interactive Visualizations
- Dynamic charts and graphs
- Real-time data exploration
- Customizable dashboards
- Export capabilities

### 💬 Conversational AI
- Natural language queries
- Context-aware responses
- Follow-up question suggestions
- Multi-session chat history

## 🛡️ Security & Privacy

- **Local Processing**: All data processing happens on your local machine
- **No Data Storage**: Files are processed in memory and not permanently stored
- **Secure Uploads**: Files are validated and sanitized before processing
- **Privacy First**: No data is sent to external services without your consent

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./insightmate.db

# File Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=./uploads

# API Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Customizing the UI

The frontend uses Tailwind CSS for styling. You can customize colors, fonts, and animations by editing:

- `frontend/tailwind.config.js` - Tailwind configuration
- `frontend/src/index.css` - Custom styles and animations

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find and kill processes using ports 3000 or 8000
   lsof -ti:3000 | xargs kill -9
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python dependencies not found**
   ```bash
   # Make sure you're in the virtual environment
   source backend/venv/bin/activate
   pip install -r backend/requirements.txt
   ```

3. **Node modules not found**
   ```bash
   # Clear npm cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **CORS errors**
   - Make sure both servers are running
   - Check that the frontend is accessing the correct backend URL
   - Verify CORS configuration in backend/main.py

### Getting Help

If you encounter issues:

1. **Check the logs** - Both servers provide detailed error messages
2. **Verify prerequisites** - Ensure all required software is installed
3. **Restart servers** - Sometimes a fresh start resolves issues
4. **Check file permissions** - Ensure the uploads directory is writable

## 🚀 Deployment

### Production Setup

For production deployment:

1. **Backend**: Use a production WSGI server like Gunicorn
2. **Frontend**: Build the React app with `npm run build`
3. **Database**: Use a production database like PostgreSQL
4. **Security**: Configure proper CORS, authentication, and HTTPS

### Docker Deployment

Docker configuration files are included for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📚 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints

- `POST /api/data/upload` - Upload data files
- `POST /api/data/analyze/{filename}` - Analyze uploaded data
- `GET /api/data/files` - List uploaded files
- `POST /api/chat/send` - Send chat messages
- `GET /api/chat/suggestions` - Get question suggestions

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎉 You're all set! Enjoy exploring your data with InsightMate!** 