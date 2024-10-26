import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  data: { type: Buffer, required: true },
});

const Recording = mongoose.model("Recording", recordingSchema);

export default Recording;
