# 🚀 InsightMate - Your Autonomous Data Analyst

An extraordinary AI-powered data analysis platform that transforms raw data into actionable insights with beautiful interactive dashboards.

## ✨ Features

- **📊 Multi-format Data Upload**: Support for CSV, Excel, JSON, and more
- **🧹 AI-Powered Data Cleaning**: Automatic detection and fixing of data issues
- **🔍 Intelligent Analysis**: Pattern recognition, trend detection, and anomaly identification
- **📈 Interactive Dashboards**: Beautiful, animated visualizations with Chart.js
- **🎨 Modern UI/UX**: Smooth animations and excellent color contrast
- **🤖 Conversational Interface**: Ask questions about your data in natural language

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance API framework
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing
- **Scikit-learn**: Machine learning for pattern detection
- **Python-multipart**: File upload handling

### Frontend
- **React**: Modern UI framework
- **TypeScript**: Type safety
- **Chart.js**: Interactive visualizations
- **Framer Motion**: Smooth animations
- **Tailwind CSS**: Beautiful styling

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd insightmate
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📋 Usage

1. **Upload Data**: Drag and drop or select your data file (CSV, Excel, JSON)
2. **AI Cleaning**: The system automatically detects and cleans data issues
3. **Analysis**: Get comprehensive insights and trend analysis
4. **Dashboard**: Explore interactive visualizations and charts
5. **Ask Questions**: Use natural language to query your data

## 🎨 Design Philosophy

- **Accessibility First**: High contrast colors and keyboard navigation
- **Smooth Animations**: Framer Motion for delightful user experience
- **Responsive Design**: Works perfectly on all devices
- **Modern Aesthetics**: Clean, professional interface

## 📁 Project Structure

```
insightmate/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── core/
│   │   ├── config.py        # Configuration settings
│   │   └── database.py      # Database models
│   ├── api/
│   │   └── routes/
│   │       ├── data.py      # Data upload and analysis endpoints
│   │       └── chat.py      # Conversational AI endpoints
│   ├── services/
│   │   ├── data_service.py  # Data processing logic
│   │   └── analysis_service.py # AI analysis engine
│   └── agents/
│       ├── data_cleaning_agent.py    # AI data cleaning
│       └── conversational_agent.py   # Chat interface
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS and styling
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
└── data/                   # Sample data and uploads
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL=sqlite:///./insightmate.db
OPENAI_API_KEY=your_openai_key_here
UPLOAD_DIR=./uploads
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@insightmate.ai or create an issue in this repository.

---

**Built with ❤️ for data analysts, scientists, and business teams** 