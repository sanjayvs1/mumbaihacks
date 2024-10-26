const MeetingData = require("../models/meetingData");
const { generateInsights } = require("../services/genaiService");

exports.startMeeting = async (req, res) => {
  try {
    const { participant1, participant2 } = req.body;
    const newMeeting = new MeetingData({
      participant1,
      participant2,
      meetingStart: new Date(),
      actions: [],
    });
    await newMeeting.save();
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await MeetingData.findById(meetingId);
    meeting.meetingEnd = new Date();
    meeting.sentiment = await generateInsights(meeting.actions);
    await meeting.save();
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
