import express from 'express';
import cors from 'cors';
import opinionRoutes from './routes/opinionRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/opinions', opinionRoutes);

app.get('/', (req, res) => {
  res.send('opiniON API is running!');
});

export default app;
