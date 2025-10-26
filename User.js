import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    skills: {
      type: [String], // Example: ["Web Development", "Graphic Design"]
      default: [],
    },
    bio: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String, // URL of uploaded profile picture
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // auto adds createdAt, updatedAt
);

const User = mongoose.model("User", userSchema);
export default User;
