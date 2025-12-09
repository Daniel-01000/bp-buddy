# 🩺 BP Buddy – Blood Pressure Tracking App

BP Buddy is a mobile health app that helps users track and manage their blood pressure.  
It’s built with **React Native/Expo** and includes an **AI-powered health coach** that gives personalised guidance based on your readings.

---

## 🔍 What It Does

### 📊 Core Features

- **Track Blood Pressure** – Log systolic/diastolic readings with timestamps  
- **Smart Categories** – Automatic classification:
  - Normal
  - Elevated
  - High (Stage 1 & 2)
  - Hypertensive Crisis
- **Visual History** – View all readings with **color-coded categories** (green / orange / red)
- **AI Health Coach** – Chat with an AI assistant that:
  - Analyses your BP data
  - Gives personalised advice
  - Answers questions about blood pressure
- **Personal Notes** – Add notes for:
  - Medications  
  - Symptoms  
  - Lifestyle changes
- **User Profiles** – Secure authentication with personal health data storage

---

## 🎨 Color-Coded Health Status

| Status       | Color     | Range (mmHg)              |
|-------------|-----------|---------------------------|
| Normal      | 🟢 Green  | `< 120/80`                |
| Elevated    | 🟠 Orange | `120–129 / < 80`          |
| High        | 🔴 Red    | `≥ 130/80`                |
| Crisis      | 🚨 Dark Red | `≥ 180/120`            |

---

## 🤖 AI Health Coach

The AI coach:

- Understands your **latest BP reading**
- Provides **health tips** and **lifestyle advice**
- Encourages **healthy habits**
- Answers **common blood pressure questions**
- Reminds you to **consult a doctor** when needed

---

## 🔒 Security & Privacy

- GDPR-aware with **user consent management**
- **Encrypted passwords** using bcrypt hashing
- **JWT authentication tokens**
- **Secure data storage** in MongoDB Atlas
- Users have the **right to delete all personal data**

---

## 🧱 Tech Stack

### 📱 Frontend (Mobile App)

- React Native with Expo
- TypeScript
- Zustand (state management)
- OpenAI API (AI coach)

### 🖥 Backend (API Server)

- Node.js with Express.js
- MongoDB Atlas (cloud database)
- JWT authentication
- Bcrypt password hashing

---

## ⚙️ How It Works

1. User signs up and logs in securely  
2. Blood pressure readings are entered and stored with timestamps  
3. Readings are **categorised and color-coded**  
4. AI coach uses the saved readings to give **personalised feedback**  
5. Users can review their **history, notes, and trends** over time  

---

## 🎯 Project Purpose

This is a **final year university project** showcasing:

- Full-stack mobile development
- AI integration for health tech
- Secure authentication & data management
- GDPR-aware design
- Medical data visualisation
- RESTful API design

---

## 🗣 In Simple Terms

> “BP Buddy is like having a personal blood pressure tracker and health coach in your pocket.  
> It remembers all your readings, shows you trends with easy c
