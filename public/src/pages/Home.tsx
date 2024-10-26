// .js
import React from "react";
import illustration from "../assets/image.jpg"; // Ensure this path is correct for your project structure
import { useNavigate } from "react-router";
//import './HomePage.css'; // You can create a separate CSS file for styles if desired

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center font-sans text-gray-800">
      {/* Navbar */}
      <header className="w-full py-4 px-8 flex justify-between items-center bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">MeetingMate</h1>
        <nav className="space-x-6 text-gray-600">
          <a href="#features" className="hover:text-blue-700">
            Features
          </a>
          <a href="#about" className="hover:text-blue-700">
            About
          </a>
          <a href="#contact" className="hover:text-blue-700">
            Contact
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-center py-16 px-8 space-y-8 md:space-y-0 md:space-x-12 bg-blue-50">
        <div className="w-full max-w-md">
          <img
            src={illustration}
            alt="Meeting Illustration"
            className="rounded-lg shadow-lg"
          />
        </div>
        <div className="max-w-lg text-center md:text-left">
          <h2 className="text-5xl font-extrabold text-blue-900 mb-4">
            AI-Driven Meeting Assistant
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Boost your remote productivity with automated meeting summaries,
            insights, and clips of essential moments.
          </p>
          <button
            onClick={() => navigate("/meeeting")}
            className="bg-blue-700 text-white py-3 px-8 rounded-full text-lg shadow-lg hover:bg-blue-800 transition duration-200 transform hover:scale-105"
          >
            Start Meeting
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 px-8 bg-white">
        <h3 className="text-3xl font-bold text-center text-blue-900 mb-10">
          Features
        </h3>
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {[
            "Real-Time Transcription",
            "Summarized Minutes",
            "Automated Clips",
            "Task Reminders",
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-blue-100 text-blue-900 p-6 rounded-lg shadow-md w-64 text-center hover:shadow-lg transition-shadow duration-200"
            >
              <h4 className="text-2xl font-semibold mb-2">{feature}</h4>
              <p className="text-gray-600">
                {feature === "Real-Time Transcription" &&
                  "Get instant transcriptions for every meeting."}
                {feature === "Summarized Minutes" &&
                  "Receive AI-generated minutes with key highlights."}
                {feature === "Automated Clips" &&
                  "Access video clips of essential meeting parts."}
                {feature === "Task Reminders" &&
                  "Receive reminders for key follow-up tasks."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-blue-900 text-white text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} MeetingMate. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
