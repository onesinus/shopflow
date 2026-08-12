const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./logger');
const requestId = require('./middleware/requestId');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(requestId);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

morgan.token('request-id', (req) => req.id || '-');

app.use(
  morgan(':method :url :status :response-time[3]ms requestId=:request-id', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use(config.apiBase, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
