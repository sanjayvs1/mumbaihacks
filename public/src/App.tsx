import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Meetings from "./pages/Meetings";
import Meeting from "./pages/Meeting";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meeting/:filename" element={<Meeting />} />
        <Route path="/meetings" element={<Meetings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
