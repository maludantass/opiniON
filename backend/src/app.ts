import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

import opinionRoutes from './routes/opinionRoutes';

app.use('/api/opinions', opinionRoutes);

app.get('/', (req, res) => {
  res.send('opiniON API is running!');
});

export default app;
