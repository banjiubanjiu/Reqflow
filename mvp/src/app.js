const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const conversationRoutes = require('./routes/conversations');
const requirementSplittingRoutes = require('./routes/requirementSplitting');
const epicsRoutes = require('./routes/epics');
const storiesRoutes = require('./routes/stories');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api', requirementSplittingRoutes);
app.use('/api', epicsRoutes);
app.use('/api', storiesRoutes);
app.use('/api/test', testRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ReqFlow MVP Backend is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;