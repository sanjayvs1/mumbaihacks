import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Meeting: React.FC = () => {
  const { filename } = useParams();
  const [summary, setSummary] = useState('');
  const [topItems, setTopItems] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const videoName = [
    { name: 'Product Track Meeting', file: "meeting1.mp4" },
    { name: 'Product Team Meeting', file: "meeting2.mp4" },
  ];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.post('http://localhost:5000/summary', { mId: filename?.slice(0, -4) });
        setSummary(response.data.summary);
        setTopItems(response.data.topItems);
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };
    if (filename) {
      fetchSummary();
    }
  }, [filename]);

  const videoSearch = async () => {
    try {
      const result = await axios.post('http://localhost:5000/video_search', { mId: filename?.slice(0, -4), query });
      const { startTime } = result.data;
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.currentTime = startTime;
        videoElement.play();
      }
    } catch (error) {
      console.error('Error searching video:', error);
    }
  };

  const meeting = videoName.find((video) => video.file === filename)?.name || 'Meeting';

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center font-sans text-gray-800">
      {/* Navbar */}
      <header className="w-full py-4 px-8 flex justify-between items-center bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">MeetHub</h1>
        <nav className="space-x-6 text-gray-600">
          <a href="/" className="hover:text-blue-700">Home</a>
          <a href="#features" className="hover:text-blue-700">Features</a>
          <a href="#contact" className="hover:text-blue-700">Contact</a>
        </nav>
      </header>

      {/* Main Content */}
      <section className="flex flex-col items-center py-16 px-8 space-y-8 w-full max-w-4xl">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-6">{meeting}</h1>
        
        <div className="flex justify-center mb-5">
          <video controls width="600" className="rounded-lg shadow-lg">
            <source src={`http://localhost:5000/video/${filename}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="flex justify-center items-center mb-8 space-x-3">
          <input
            type="text"
            placeholder="Search in video..."
            className="input input-bordered text-white w-full max-w-xs px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="bg-blue-700 text-white py-2 px-6 rounded-full shadow-lg hover:bg-blue-800 transition duration-200 transform hover:scale-105"
            onClick={videoSearch}
          >
            Search
          </button>
        </div>

        <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Summary</h2>
          <p className="text-lg text-gray-700 mb-6">{summary}</p>
        </div>

        <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Top Action Items</h2>
          <ul className="list-disc list-inside text-lg text-gray-700">
            {topItems.map((item, index) => (
              <li key={index} className="mb-2">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-blue-900 text-white text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} MeetHub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Meeting;
