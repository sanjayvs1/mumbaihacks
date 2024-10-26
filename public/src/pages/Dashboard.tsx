import React, { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { Mic, MicOff, Camera, CameraOff, PhoneOff } from "lucide-react";
import { host } from "../utils/apiroutes";
import axios from "axios";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

interface Navigator {
  getUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (err: Error) => void
  ) => void;
}

const App: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Check for media devices support
  const checkMediaDevicesSupport = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const getUserMedia =
        navigator.getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia;

      if (!getUserMedia) {
        throw new Error("Media devices are not supported in this browser");
      }
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    try {
      socketRef.current = io(host, {
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ["websocket", "polling"],
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to signaling server");
      });

      socketRef.current.on("connect_error", (error) => {
        setError(`Failed to connect to signaling server: ${error.message}`);
      });

      socketRef.current.on("call-ended", () => {
        handleEndCall();
      });

      return () => {
        socketRef.current?.disconnect();
      };
    } catch (error) {
      setError(
        `Socket initialization error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    try {
      console.log("Creating peer connection...");
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        console.log("ICE Connection State:", pc.iceConnectionState);
      };

      pc.onicegatheringstatechange = () => {
        console.log("ICE Gathering State:", pc.iceGatheringState);
      };

      pc.onsignalingstatechange = () => {
        console.log("Signaling State:", pc.signalingState);
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          if (
            (track.kind === "audio" && isAudioEnabled) ||
            (track.kind === "video" && isVideoEnabled)
          ) {
            pc.addTrack(track, localStream);
          }
        });
      }

      pc.ontrack = (event) => {
        console.log("Received remote track");
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log("Sending ICE candidate");
          socketRef.current.emit("signal", { candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsConnected(true);
          setError("");
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          setIsConnected(false);
          setError("Peer connection failed. Please try again.");
        }
      };

      return pc;
    } catch (error) {
      setError(
        `Error creating peer connection: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }, [localStream, isAudioEnabled, isVideoEnabled]);

  const initializeStream = useCallback(async () => {
    try {
      setError("");
      checkMediaDevicesSupport();

      console.log("Requesting media permissions...");
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Got media stream");

      audioTrackRef.current = stream.getAudioTracks()[0];
      videoTrackRef.current = stream.getVideoTracks()[0];

      if (audioTrackRef.current) {
        audioTrackRef.current.enabled = isAudioEnabled;
      }
      if (videoTrackRef.current) {
        videoTrackRef.current.enabled = isVideoEnabled;
      }

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      let errorMessage = "Error accessing media devices: ";
      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          errorMessage += "Permission to access camera/microphone was denied";
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          errorMessage += "No camera/microphone found";
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          errorMessage += "Camera/microphone is already in use";
        } else if (error.name === "OverconstrainedError") {
          errorMessage +=
            "Camera/microphone cannot satisfy the requested constraints";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += String(error);
      }

      setError(errorMessage);
      console.error("Media initialization error:", error);
      throw error;
    }
  }, [checkMediaDevicesSupport, isAudioEnabled, isVideoEnabled]);

  useEffect(() => {
    const setupInitialStream = async () => {
      if (!localStream) {
        try {
          await initializeStream();
        } catch (error) {
          console.error("Failed to initialize stream:", error);
        }
      }
    };

    setupInitialStream();

    const handleSignal = async (data: any) => {
      try {
        if (
          !peerConnectionRef.current ||
          peerConnectionRef.current.connectionState === "closed"
        ) {
          console.log("Creating new peer connection for signaling");
          peerConnectionRef.current = createPeerConnection();
          if (!peerConnectionRef.current)
            throw new Error("Failed to create peer connection");
        }

        if (data.offer) {
          console.log("Received offer, setting remote description");
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          console.log("Creating answer");
          const answer = await peerConnectionRef.current.createAnswer();
          console.log("Setting local description");
          await peerConnectionRef.current.setLocalDescription(answer);
          console.log("Sending answer");
          socketRef.current?.emit("signal", { answer });
        } else if (data.answer) {
          console.log("Received answer, setting remote description");
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } else if (data.candidate) {
          console.log("Received ICE candidate");
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } else {
            console.log("Skipping ICE candidate - no remote description");
          }
        }
      } catch (error) {
        setError(
          `Signaling error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        console.error("Signaling error:", error);
      }
    };

    socketRef.current?.on("signal", handleSignal);

    return () => {
      socketRef.current?.off("signal", handleSignal);
    };
  }, [localStream, createPeerConnection, initializeStream]);

  const startCall = async () => {
    setIsConnecting(true);
    setIsConnected(false);
    try {
      const stream = await initializeStream();
      peerConnectionRef.current = createPeerConnection();
      stream
        .getTracks()
        .forEach((track) => peerConnectionRef.current?.addTrack(track, stream));

      const offer = await peerConnectionRef.current!.createOffer();
      await peerConnectionRef.current!.setLocalDescription(offer);

      socketRef.current?.emit("signal", { offer });
    } catch (error) {
      setError(
        `Error starting call: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      console.error("Error starting call:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    handleEndCall();
    socketRef.current?.emit("call-ended");
  };

  const handleEndCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsConnected(false);
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
  };

  const toggleAudio = () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = !audioTrackRef.current.enabled;
      setIsAudioEnabled(audioTrackRef.current.enabled);
    }
  };

  const toggleVideo = () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.enabled = !videoTrackRef.current.enabled;
      setIsVideoEnabled(videoTrackRef.current.enabled);
    }
  };

  const startRecording = () => {
    if (localStream) {
      const recorder = new MediaRecorder(localStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          // Attach a timestamp to each chunk of data
          const timestampedData = {
            timestamp: new Date().toISOString(), // Store timestamp as ISO string
            chunk: event.data, // Actual recorded data
          };
          socketRef.current.emit("audio-visual-data", timestampedData);
        }
      };

      recorder.onstart = () => setIsRecording(true);
      recorder.onstop = () => setIsRecording(false);
      recorder.start(1000); // Collects data every 1 second
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-full md:w-2/3 lg:w-1/2 mb-2 border border-gray-300"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-full md:w-2/3 lg:w-1/2 mb-2 border border-gray-300"
        />
      </div>
      <div className="flex justify-center">
        <button
          onClick={isConnected ? endCall : startCall}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-700"
        >
          {isConnected ? <PhoneOff /> : "Start Call"}
        </button>
      </div>
      <div className="flex justify-center mt-2">
        <button onClick={toggleAudio} className="p-2">
          {isAudioEnabled ? <Mic /> : <MicOff />}
        </button>
        <button onClick={toggleVideo} className="p-2">
          {isVideoEnabled ? <Camera /> : <CameraOff />}
        </button>
      </div>
    </div>
  );
};

export default App;
