// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import ComparePage from "./pages/ComparePage";

function App() {
  return (
    <BrowserRouter>
     

      <main className="app-main centered">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </div>
      </main>

      <footer className="app-footer">
        © 2025 LungSight — Accelerating healthcare through AI.
      </footer>
    </BrowserRouter>
  );
}

export default App;