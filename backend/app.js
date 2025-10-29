import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectToSocket } from './src/controllers/socketManager.js';

import cors from 'cors';
import userRoutes from './src/routes/users.routes.js';

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8080);
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api/v1/users', userRoutes);

const start = async () => {
    const connectdb = await mongoose.connect(process.env.mongodburl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log(`Connected to MongoDB : ${connectdb.connection.host}`);
    server.listen(app.get("port"), () => {
        console.log('Server is running on port ', process.env.PORT);
    });
}

start();