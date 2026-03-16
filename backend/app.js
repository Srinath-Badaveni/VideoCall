import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectToSocket } from "./src/controllers/socketManager.js";
import { connectToChatSocket } from "./src/controllers/chatNamespace.js";

import cors from "cors";
import userRoutes from "./src/routes/users.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import pushRoutes from "./src/routes/push.routes.js";
import friendRoutes from "./src/routes/friend.routes.js";
import { initWebPush } from "./src/controllers/push.controller.js";

const app = express();
const server = createServer(app);

// Default namespace: video-call signalling (untouched)
const io = connectToSocket(server);

// /chat namespace: standalone real-time chat
connectToChatSocket(io);

app.set("port", process.env.PORT || 8080);
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/push", pushRoutes);
app.use("/api/v1/friends", friendRoutes);

const start = async () => {
  // Initialize VAPID for Web Push (requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in .env)
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    initWebPush();
    console.log("[Push] VAPID initialized");
  } else {
    console.warn("[Push] VAPID keys missing in .env — Web Push disabled");
  }
  const connectdb = await mongoose.connect(process.env.mongodburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`Connected to MongoDB : ${connectdb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log("Server is running on port ", process.env.PORT);
  });
};

start();
