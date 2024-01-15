const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const UserModel = require('./models/User');
const TaskModel = require('./models/Task');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI);





const getUserIdFromToken = (req, res, next) => {
    // Check if the 'Authorization' header is present
    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader) {
        return res.status(401).json({ error: 'Unauthorized - Missing Authorization header' });
    }

    // Check if the 'Authorization' header has the expected format
    const tokenParts = authorizationHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Unauthorized - Invalid Authorization header format' });
    }

    const token = tokenParts[1];

    try {
        const decodedToken = jwt.verify(token, 'secret1234'); // Replace with your secret key
        req.userId = decodedToken.userId;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
};








app.post('/signup', async (req, res) => {
    const { username, email, password, phoneNumber } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create a new user (without explicitly hashing the password)
        const newUser = new UserModel({
            username,
            email,
            password,
            phoneNumber,
        });

        // Save the user to the database
        await newUser.save();

        // Generate a token for the new user
        const token = jwt.sign({ userId: newUser._id }, 'secret1234', { expiresIn: '1h' });

        // Respond with the token and any other relevant user information
        res.json({
            token,
            userId: newUser._id,
            username: newUser.username,
            email: newUser.email,
            xpBalance: newUser.xpBalance,
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login request:', email, password);


        // Check if the user exists in the database
        const user = await UserModel.findOne({ email });
        console.log('User found:', user);


        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        // If the password is valid, create a JWT token
        const token = jwt.sign({ userId: user._id }, 'secret1234', { expiresIn: '1h' });

        // Send the token and any other relevant user information in the response
        res.json({
            token,
            userId: user._id,
            username: user.username,
            email: user.email,
            xpBalance: user.xpBalance,
        });
        console.log('backend login success');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/user/:id', async (req, res) => {
    const user = await UserModel.find({ _id: req.params.id });
    res.send(user);
});
app.get('/tasks', async (req, res) => {
    const tasks = await TaskModel.find({});
    res.send(tasks);
});
app.get('/tasks/:id', async (req, res) => {
    const task = await TaskModel.find({ _id: req.params.id });
    res.send(task);
});

// Define the route
app.post('/complete-task/:id', getUserIdFromToken, async (req, res) => {
    const userId = req.userId;
    // Find the user by ID
    const user = await UserModel.findById(userId);
    const taskId = req.params.id;
    // Check if the task is already completed
    if (user.completedTasks.includes(taskId)) {
        console.log('Task already completed by the user');
        return res.send({ message: 'Task Already Completed!' });
    }

    // Update the user's completedTasks array
    user.completedTasks.push(taskId);

    // Increase the user's xpBalance
    const task = await TaskModel.findById(taskId);
    user.xpBalance += task.xpPoints;

    // Save the updated user document
    await user.save();

    // Send the response
    res.json({
        message: 'Task completed successfully',
        completedTasks: user.completedTasks,
        xpBalance: user.xpBalance,
    });
});

app.delete('/remove-completed-task/:taskId', getUserIdFromToken, async (req, res) => {
    const userId = req.userId;
    // Find the user by ID
    const user = await UserModel.findById(userId);
    const taskId = req.params.taskId;
    // Check if the task is already completed
    if (!user.completedTasks.includes(taskId)) {
        return res.status(400).json({ error: 'Task not completed by the user' });
    }

    // Update the user's completedTasks array
    user.completedTasks.pull(taskId);

    // Decrease the user's xpBalance
    const task = await TaskModel.findById(taskId);
    user.xpBalance -= task.xpPoints;

    // Save the updated user document
    await user.save();

    // Send the response
    res.json({
        message: 'Completed task removed successfully',
        completedTasks: user.completedTasks,
        xpBalance: user.xpBalance,
    });

});

app.listen(5000, () => console.log(`Server started on port: ${PORT}`));