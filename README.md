# 🚀 AI Job Application Tracker

## 📌 Overview

A full-stack web application to track job applications using a Kanban board with AI-powered job description parsing and resume suggestions.

---

## 🛠 Tech Stack

* Frontend: React + TypeScript + Tailwind CSS (Vite)
* Backend: Node.js + Express + TypeScript
* Database: MongoDB
* Authentication: JWT + bcrypt
* AI: Google Gemini API

---

## ✨ Features

* User authentication (register/login)
* Kanban board (Applied → Interview → Offer → Rejected)
* Drag & drop job application tracking
* AI-powered job description parsing
* AI-generated resume bullet suggestions
* Create, edit, delete applications
* Multi API key fallback for rate limits

---

## ⚙️ How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/vishalmp-dev/ai-job-tracker.git
cd ai-job-tracker
```

### 2. Backend setup

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file inside the backend folder:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY_1=your_key_1
GEMINI_API_KEY_2=your_key_2
```

---

## 🧠 Key Decisions

* AI logic is placed in a dedicated service layer
* Implemented retry logic for API failures (503)
* Multi API key rotation to handle rate limits (429)
* Graceful fallback responses to prevent app crashes
* Clean separation between frontend and backend

---

## 🧪 Handling AI Failures

* Retry mechanism for temporary failures
* API key rotation on rate limits
* Fallback responses when AI fails
* Frontend handles loading and error states gracefully

---

## 🚀 Future Improvements

* Deploy the application
* Add dashboard analytics
* Cache AI responses
* Improve UI/UX

---
