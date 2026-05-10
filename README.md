# 🎓 Topper AI - The Ultimate Study Engine

![Topper AI Banner](https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80)

Topper AI is a premium, AI-driven learning platform designed to help students achieve academic excellence through automated study material generation, targeted testing, and gamified competition.

## 🚀 Key Features

### 🧠 AI Generation Engine
- **Topper Notes**: Clean, professional Markdown study guides generated from any PDF, Doc, or URL.
- **Smart Summaries**: High-fidelity summaries that capture key concepts and exam-focus areas.
- **Dynamic Flashcards**: Instant study cards for active recall.

### 📝 Targeted Testing
- **Mock Exam Engine**: A high-stakes, timed exam environment simulating real-world test conditions.
- **Difficulty Selection**: Fix your test difficulty to **Easy**, **Medium**, or **Hard** to match your learning curve.
- **Practice Quizzes**: Targeted MCQ sessions generated directly from your uploaded materials.

### 🏆 Gamification & Engagement
- **Global Leaderboard**: Compete with students worldwide and climb the ranks from *Newbie* to *Grandmaster*.
- **Daily Streaks**: Stay active and maintain your "Flame" streak.
- **Achievement Badges**: Unlock rewards as you master more subjects.

## 🛠️ Technology Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Supabase (Auth, Database, RLS Security)
- **AI**: Gemini 1.5 Pro via OpenRouter

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [YOUR_GITHUB_URL]
   cd topper-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Launch Development Server**
   ```bash
   npm run dev
   ```

## 🔐 Database Security
Topper AI uses strict **Row Level Security (RLS)** to protect user data. Ensure you run the `supabase_schema.sql` in your Supabase SQL Editor to enable all features and security policies.

---
*Built with ❤️ for students by Antigravity AI*
