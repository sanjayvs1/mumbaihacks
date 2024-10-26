import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import Meetings from "./pages/Meetings";
import Meeting from "./pages/Meeting";
import Web3Login from "./pages/Web3Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Web3Login />} /> {/* Added Web3Login route */}
        <Route path="/HomePage" element={<HomePage />} /> 
        <Route path="/meeting/:filename" element={<Meeting />} />
        <Route path="/meetings" element={<Meetings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

