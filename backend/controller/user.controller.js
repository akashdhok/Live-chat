import { Message } from "../models/message.model.js";


export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveMessage = async (data) => {
  try {
    await Message.create(data);
  } catch (err) {
    console.log("Save message error:", err);
  }
};
