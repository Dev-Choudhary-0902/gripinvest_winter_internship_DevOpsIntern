"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionLogger = transactionLogger;
const database_1 = require("../database");
function transactionLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', async () => {
        const duration = Date.now() - start;
        // Skip logging requests to the logs endpoint to prevent self-logging spam
        if (req.originalUrl.startsWith('/api/logs/')) {
            return;
        }
        try {
            await (0, database_1.executeQuery)('INSERT INTO transaction_logs (user_id, email, endpoint, http_method, status_code, error_message) VALUES (?, ?, ?, ?, ?, ?)', [
                req.userId ?? null,
                req.userEmail ?? null,
                req.originalUrl,
                req.method,
                res.statusCode,
                res.statusCode >= 400 ? `${req.method} ${req.originalUrl} failed in ${duration}ms` : null
            ]);
            if (process.env.NODE_ENV !== 'production') {
                console.log('[txlog] inserted', {
                    userId: req.userId ?? null,
                    endpoint: req.originalUrl,
                    method: req.method,
                    status: res.statusCode,
                });
            }
        }
        catch (err) {
            // avoid crashing on logging failures
            if (process.env.NODE_ENV !== 'production') {
                console.error('[txlog] insert failed', err);
            }
        }
    });
    next();
}
