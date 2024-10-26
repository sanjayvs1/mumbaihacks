import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Meeting: React.FC = () => {
    const { filename } = useParams();
    const [summary, setSummary] = React.useState('');
    const [topItems, setTopItems] = useState([]);
    const [query, setQuery] = useState('');

    const videoName = [
        { name: 'Product Track Meeting', file: "meeting1.mp4" },
        { name: 'Product Team Meeting', file: "meeting2.mp4" }
    ];
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await axios.post('http://localhost:5000/summary', { mId: filename?.slice(0, -4) });
                console.log(response.data);
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

    let meeting: any = videoName.find(video => video.file === filename);
    meeting = meeting ? meeting.name : 'Meeting'
    return (
        <div className="container mx-auto p-5 max-w-4xl">
            <h1 className="text-4xl font-bold text-center mb-5">{meeting}</h1>
            <div className="flex justify-center mb-5">
                <video controls width="600" className="rounded-lg shadow-lg">
                    <source src={`http://localhost:5000/video/${filename}`} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="flex justify-center mb-5">
                <input 
                    type="text" 
                    placeholder="Search in video..." 
                    className="input input-bordered w-full max-w-xs mr-2" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                />
                <button 
                    className="btn btn-primary" 
                    onClick={videoSearch}
                >
                    Search
                </button>
            </div>
            <h1 className="text-2xl font-semibold mb-3">Summary</h1>
            <p className="text-lg mb-5 p-3 border rounded-md">{summary}</p>
            <h1 className="text-2xl font-semibold mb-3">Top Action Items</h1>
            <ul className="list-disc list-inside">
                {topItems.map((item, index) => (
                    <li key={index} className="text-lg mb-2">{item}</li>
                ))}
            </ul>
        </div>
    );
};

export default Meeting;