import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import membersRoutes from './routes/members';
import loansRoutes from './routes/loans';
import savingsRoutes from './routes/savings';
import expensesRoutes from './routes/expenses';
import reportsRoutes from './routes/reports';
import usersRoutes from './routes/users';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sharvic-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
