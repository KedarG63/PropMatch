import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import matchesRouter from './routes/matches';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/matches', matchesRouter);

const PORT = process.env.PORT ?? 8080;
app.listen(PORT, () => console.log(`PropMatch API listening on :${PORT}`));
