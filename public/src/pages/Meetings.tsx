import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Meetings() {
    const videoName = [
        { name: 'Product Track Meeting', file: "meeting1.mp4" },
        { name: 'Product Team Meeting', file: "meeting2.mp4" }
    ];
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/videos');
                console.log(response.data);
                setVideos(response.data);
            } catch (error) {
                console.log(error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="container mx-auto p-5">
            <h1 className="text-3xl font-bold text-center mb-5">Welcome to the Meetings Page</h1>
            <table className="table w-full text-center">
                <thead>
                    <tr>
                        <th className="text-center text-xl p-2">Meeting Name</th>
                    </tr>
                </thead>
                <tbody>
                    {/* {videos.map((video, index) => (
                        <tr className='p-2' key={index}>
                            <p className='p-2'>  <Link to={`/meeting/${video}`} className="btn btn-primary">
                                {video}
                            </Link></p>
                        </tr>
                    ))} */}
                    {videoName.map((video, index) => (
                        <tr className='p-2' key={index}>
                            <p className='p-2'>  <Link to={`/meeting/${video.file}`} className="btn btn-primary">
                                {video.name}
                            </Link></p> </tr>))}
                </tbody>
            </table>
        </div>
    );
}
