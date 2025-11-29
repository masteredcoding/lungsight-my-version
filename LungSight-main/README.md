# LungSight

Simple end-to-end demo of an AI medical-imaging workflow using a React (Vite) frontend and a mock Express backend that mimics HOPPR’s API responses.

✨ Features
Upload or select from the 4 sample X-ray images provided in sample DICOM data: https://drive.google.com/file/d/1XGdT2I6-KdCYFdnDK-ZWP7VLyIA27vn3/view
  Chose from these 4 to upload:
- HackathonSampleDICOMImages/Calcification/train/07d82e7e5749cbc21633134f489a7fbf.dcm
- HackathonSampleDICOMImages/Calcification/train/17dc4a83558d835efd5f7d6f110f07f3.dcm
- HackathonSampleDICOMImages/Calcification/train/c341b3f8a0353bab2ec49147b97ce9d0.dcm
- HackathonSampleDICOMImages/Consolidation/train/de7c0acddd7ed5fb90f5f5e12458235b.dcm
  
Mock AI x-ray analysis that is  returned in HOPPR-like JSON
Optional UI bits: findings list, urgency type, heatmap overlay

💻 Tech Stack
Frontend
React + Vite
React Router
Tailwind / UI components 

Backend
Node.js + Express
multer
cors
crypto, path, fs (utils)
Static file server for sample images


🔧 Setup & Run
1) Install dependencies
From the project root:
npm install
cd backend && npm install && cd ..
If you keep a single package.json at the root that includes express, multer, etc., one npm install is enough.

2) Start the backend 
# If backend is at ./backend/server.js
node backend/server.js


3) Start the frontend (Vite)
npm run dev
Vite will print a local URL (usually http://localhost:5173).
The frontend will call the backend at VITE_API_BASE.


🔑API Keys Needed
When API is utilized: Hoppr API key is needed, add in .env
add hoppr base
PORT=5050
THRESHOLD=0.5
USE_MOCK=false 

