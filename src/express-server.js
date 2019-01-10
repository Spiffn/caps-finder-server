import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
app.use(morgan('combined'));
app.use(json());
app.use(cors());

app.get('/', (req, res) => {
  res.send({ message: 'bruh why' });
});

export default app;
