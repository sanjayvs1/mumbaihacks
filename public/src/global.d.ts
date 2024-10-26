declare global {
  interface Navigator {
    getUserMedia?(
      constraints: MediaStreamConstraints,
      success: (stream: MediaStream) => void,
      error: (err: Error) => void
    ): void;
  }
}

export {};
