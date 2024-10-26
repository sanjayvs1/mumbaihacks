const mongoose = require("mongoose");

const meetingDataSchema = new mongoose.Schema({
  participant1: String,
  participant2: String,
  meetingStart: Date,
  meetingEnd: Date,
  actions: Array, // Store action items and key insights
  sentiment: String, // Summary of participant sentiment
});

module.exports = mongoose.model("MeetingData", meetingDataSchema);
