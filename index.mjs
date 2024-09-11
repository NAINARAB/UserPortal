import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors'
import indexRouter from './routes/index.mjs';
import morgan from 'morgan';
import fs from 'fs';
import { connectDB } from './config/dbconfig.mjs';
import dotenv from 'dotenv';
import { listRoutes } from './middleware/apilist.mjs';
import { failed } from './res.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));


const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('dev', { stream: logStream }));

connectDB();

app.use('/api', indexRouter);

app.use('/api', (req, res) => {
    try {
        return listRoutes(app, res, 'User Portal APIs')
    } catch (e) {
        console.error(e);
        return failed(res, 'Failed to list routes')
    }
})


app.use('/api', (req, res) => {
    try {
        return listRoutes(app, res)
    } catch (e) {
        console.error(e);
        return failed(res, 'Failed to list routes')
    }
})


const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});