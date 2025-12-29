import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

export const Message = mongoose.model("Message", messageSchema);
