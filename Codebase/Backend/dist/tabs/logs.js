"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsRouter = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("./auth");
exports.logsRouter = (0, express_1.Router)();
exports.logsRouter.get('/user/:userId', auth_1.requireAuth, async (req, res) => {
    const userId = String(req.params.userId);
    const rows = await (0, database_1.executeQuery)('SELECT * FROM transaction_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 200', [userId]);
    const logs = rows.map((r) => ({
        id: Number(r.id),
        userId: r.user_id,
        email: r.email,
        endpoint: r.endpoint,
        httpMethod: r.http_method,
        statusCode: Number(r.status_code),
        errorMessage: r.error_message,
        createdAt: r.created_at,
    }));
    res.json(logs);
});
exports.logsRouter.get('/user/me', auth_1.requireAuth, async (req, res) => {
    const userId = req.userId;
    const rows = await (0, database_1.executeQuery)('SELECT * FROM transaction_logs WHERE user_id = ? AND endpoint != "/api/logs/user/me" ORDER BY created_at DESC LIMIT 500', [userId]);
    // Disable all caching mechanisms and add timestamp to make response unique
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': '',
        'Last-Modified': '',
        'X-Timestamp': Date.now().toString()
    });
    const logs = rows.map((r) => ({
        id: Number(r.id),
        userId: r.user_id,
        email: r.email,
        endpoint: r.endpoint,
        httpMethod: r.http_method,
        statusCode: Number(r.status_code),
        errorMessage: r.error_message,
        createdAt: r.created_at,
    }));
    res.json(logs);
});
exports.logsRouter.get('/summary/:userId', auth_1.requireAuth, async (req, res) => {
    const userId = String(req.params.userId);
    const rows = await (0, database_1.executeQuery)('SELECT * FROM transaction_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 500', [userId]);
    const errors = rows.filter((l) => Number(l.status_code) >= 400);
    const summary = `You had ${errors.length} error(s). Most common status: ${mode(errors.map((e) => Number(e.status_code))) ?? 'n/a'}.`;
    res.json({ summary });
});
function mode(nums) {
    if (nums.length === 0)
        return null;
    const counts = new Map();
    for (const n of nums)
        counts.set(n, (counts.get(n) ?? 0) + 1);
    let max = -1, val = nums[0];
    for (const [k, v] of counts)
        if (v > max) {
            max = v;
            val = k;
        }
    return val;
}
