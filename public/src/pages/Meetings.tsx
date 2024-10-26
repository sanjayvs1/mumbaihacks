import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Meetings() {
  const videoName = [
    { name: "Product Track Meeting", file: "meeting1.mp4" },
    { name: "Product Team Meeting", file: "meeting2.mp4" },
  ];
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/videos");
        console.log(response.data);
        setVideos(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center font-sans text-gray-800">
      {/* Navbar */}
      <header className="w-full py-4 px-8 flex justify-between items-center bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">MeetHub</h1>
        <nav className="space-x-6 text-gray-600">
          <a href="#meetings" className="hover:text-blue-700">Meetings</a>
          <a href="#contact" className="hover:text-blue-700">Contact</a>
        </nav>
      </header>

      {/* Meetings Section */}
      <section className="flex flex-col items-center py-16 px-8 space-y-8 w-full max-w-4xl mb-20">
      <Link to="/" className="bg-blue-700 text-white py-2 px-4 rounded-full text-sm shadow-md hover:bg-blue-800 transition duration-200">Join or Create a Meet</Link>

        <h2 className="text-4xl font-extrabold text-blue-900 mb-6">Meeting Transcripts</h2>
        <p className="text-xl text-gray-600 text-center mb-6">
          Access recorded meetings and view summaries of essential moments.
        </p>

        <table className="w-full bg-white rounded-lg shadow-lg text-center">
          <thead className="bg-blue-100">
            <tr>
              <th className="text-xl p-4 text-blue-900 font-semibold">Meeting Name</th>
              <th className="text-xl p-4 text-blue-900 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videoName.map((video, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-4 text-gray-700">{video.name}</td>
                <td className="p-4">
                  <Link to={`/meeting/${video.file}`} className="bg-blue-700 text-white py-2 px-4 rounded-full text-sm shadow-md hover:bg-blue-800 transition duration-200">
                    View Transcript
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-blue-900 text-white text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} MeetHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
