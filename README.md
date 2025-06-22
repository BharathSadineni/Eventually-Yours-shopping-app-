# Neon Shopping Assistant - Full Stack Application

A modern, AI-powered shopping recommendation system with a cyberpunk neon aesthetic. This application combines a React/Next.js frontend with a Python Flask backend that uses Amazon scraping and Google Gemini AI for personalized product recommendations.

## 🚀 Features

### Frontend (React/Next.js)
- **Neon Cyberpunk Design**: Sharp contrasts, electric colors, animated backgrounds
- **Responsive Design**: Works perfectly on desktop and mobile
- **Three Main Pages**: Landing, User Info, Shopping Input
- **Real-time Animations**: Smooth transitions and neon glow effects
- **Import/Export**: JSON data import/export functionality

### Backend (Python/Flask)
- **AI-Powered Recommendations**: Uses Google Gemini API for intelligent product categorization
- **Amazon Product Scraping**: Real-time product data from Amazon
- **Smart Filtering**: Budget-based product filtering
- **Multi-threaded Processing**: Concurrent product fetching for better performance
- **Session Management**: Secure user session handling

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL (optional, for user management)

### Frontend Setup
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

### Backend Setup
\`\`\`bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask API server
python backend_api.py
\`\`\`

### Environment Variables
Create a `.env.local` file in the root directory:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:5000
\`\`\`

## 🎯 Usage

1. **Start the Backend**: Run `python backend_api.py` in the backend directory
2. **Start the Frontend**: Run `npm run dev` in the root directory
3. **Access the App**: Open http://localhost:3000 in your browser

### User Flow
1. **Landing Page**: Animated introduction with product category carousel
2. **User Information**: Enter personal preferences, location, budget, interests
3. **Shopping Input**: Specify shopping occasion, style, and specific needs
4. **AI Recommendations**: Get personalized product recommendations with AI reasoning

## 🔧 API Endpoints

- `GET /api/health` - Health check
- `POST /api/user-info` - Store user information
- `POST /api/shopping-recommendations` - Get AI-powered product recommendations
- `GET /api/export-data/<session_id>` - Export user data

## 🎨 Design System

### Color Palette
- **Void**: #000000 (Deep black backgrounds)
- **Fuchsia**: #FF00FF (Electric fuchsia accents)
- **Jewel**: #00FFFF (Vibrant cyan details)
- **Stark**: #FFFFFF (Pure white text)

### Key Features
- Sharp, angular design elements
- Neon glow effects using CSS box-shadow
- High contrast for maximum visual impact
- Smooth animations and transitions

## 🧠 AI Integration

The application uses Google Gemini AI for:
- **Category Generation**: Analyzing user input to suggest relevant product categories
- **Product Ranking**: Intelligent sorting of products based on user preferences
- **Personalized Reasoning**: Detailed explanations for each recommendation

## 🛒 Amazon Integration

- **Multi-domain Support**: Automatically selects appropriate Amazon domain based on user location
- **Smart Scraping**: Rotating user agents and rate limiting to avoid blocking
- **Budget Filtering**: Filters products based on user's specified budget range
- **Real-time Data**: Fresh product information including prices, ratings, and images

## 📱 Responsive Design

- **Mobile-first**: Optimized for all screen sizes
- **Touch-friendly**: Large buttons and intuitive gestures
- **Performance**: Optimized animations and lazy loading
- **Accessibility**: ARIA labels and keyboard navigation support

## 🔒 Security Features

- **Session Management**: Secure user session handling
- **Input Validation**: Comprehensive form validation
- **Error Handling**: Graceful error handling and user feedback
- **Rate Limiting**: Built-in protection against API abuse

## 🚀 Deployment

### Frontend (Vercel)
\`\`\`bash
npm run build
# Deploy to Vercel or your preferred platform
\`\`\`

### Backend (Production)
\`\`\`bash
# Use a production WSGI server like Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 backend_api:app
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the GitHub issues
2. Review the API documentation
3. Contact the development team

---

**Built with ❤️ using React, Next.js, Python, Flask, and AI**
\`\`\`

This complete full-stack application integrates your Python backend with the React frontend, providing:

## 🎯 **Key Integration Points**

1. **API Connection**: Frontend connects to Flask backend at `http://localhost:5000`
2. **Session Management**: User data flows from frontend → backend → AI processing
3. **Real-time Recommendations**: Amazon scraping + Gemini AI integration
4. **Neon Design**: Consistent cyberpunk aesthetic throughout
5. **Error Handling**: Comprehensive error handling and user feedback

## 🚀 **To Run the Complete Application**

1. **Backend**: `cd backend && python backend_api.py`
2. **Frontend**: `npm run dev`
3. **Access**: Open `http://localhost:3000`

The application now provides a complete shopping assistant experience with AI-powered recommendations, real Amazon product data, and a stunning neon interface!
