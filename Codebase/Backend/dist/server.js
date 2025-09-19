"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const database_1 = __importDefault(require("./database"));
const auth_1 = require("./tabs/auth");
const products_1 = require("./tabs/products");
const investments_1 = require("./tabs/investments");
const logs_1 = require("./tabs/logs");
const transactionLogger_1 = require("./middleware/transactionLogger");
const app = (0, express_1.default)();
const logger = (0, pino_1.default)({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, pino_http_1.default)({ logger }));
app.use(transactionLogger_1.transactionLogger);
// Disable ETags globally to prevent caching issues
app.disable('etag');
// health
app.get('/health', async (_req, res) => {
    try {
        await database_1.default.execute('SELECT 1');
        res.json({ status: 'ok', db: 'up' });
    }
    catch {
        res.status(500).json({ status: 'error', db: 'down' });
    }
});
// routes
app.use('/api/auth', auth_1.authRouter);
app.use('/api/products', products_1.productsRouter);
app.use('/api/investments', investments_1.investmentsRouter);
app.use('/api/logs', logs_1.logsRouter);
// error handler
app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
    logger.info({ port }, 'Backend listening');
});
