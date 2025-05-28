import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // 👈 importuj cors
import sendEmailHandler from './api/sendEmail.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//Povolit požadavky z React frontendu
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['POST'],
}));

app.use(bodyParser.json());

app.post('/send-email', sendEmailHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
