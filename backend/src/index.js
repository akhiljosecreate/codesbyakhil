const express = require('express');
const cors = require('cors');

const consultantsRouter = require('./routes/consultants');
const projectsRouter = require('./routes/projects');
const allocationsRouter = require('./routes/allocations');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/consultants', consultantsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/allocations', allocationsRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
