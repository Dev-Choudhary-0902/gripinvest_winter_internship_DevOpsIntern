"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.requireAuth = requireAuth;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = require("../database");
exports.authRouter = (0, express_1.Router)();
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().optional(),
    riskAppetite: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
});
function passwordFeedback(password) {
    const tips = [];
    const length = password.length;
    // Length-based feedback
    if (length < 8) {
        tips.push('Use at least 8 characters');
    }
    else if (length < 12) {
        tips.push('Consider using 12+ characters for maximum security');
    }
    // Character type feedback
    if (!/[A-Z]/.test(password))
        tips.push('Add an uppercase letter');
    if (!/[a-z]/.test(password))
        tips.push('Add a lowercase letter');
    if (!/[0-9]/.test(password))
        tips.push('Add a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        tips.push('Use a special character (!@#$%^&*)');
    // Advanced security tips
    if (password.toLowerCase() === password || password.toUpperCase() === password) {
        tips.push('Mix uppercase and lowercase letters');
    }
    if (/(.)\1{2,}/.test(password)) {
        tips.push('Avoid repeating characters (e.g., "aaa", "111")');
    }
    if (password.includes('password') || password.includes('123456') || password.includes('qwerty')) {
        tips.push('Avoid common patterns like "password" or "123456"');
    }
    // Positive reinforcement
    if (tips.length === 0) {
        tips.push('Excellent! Your password meets all security requirements');
    }
    return tips;
}
exports.authRouter.post('/signup', async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, firstName, lastName, riskAppetite } = parsed.data;
    // Check if user already exists
    const existing = await (0, database_1.executeQuery)('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
        return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const userId = crypto.randomUUID();
    // Create new user
    await (0, database_1.executeQuery)('INSERT INTO users (id, email, password_hash, first_name, last_name, risk_appetite) VALUES (?, ?, ?, ?, ?, ?)', [userId, email, passwordHash, firstName, lastName || null, riskAppetite || 'moderate']);
    const token = jsonwebtoken_1.default.sign({ sub: userId, email }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.json({
        token,
        user: { id: userId, email, firstName, lastName, riskAppetite: riskAppetite || 'moderate' },
        ai_feedback: passwordFeedback(password)
    });
});
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) });
exports.authRouter.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;
    // Find user by email
    const users = await (0, database_1.executeQuery)('SELECT id, email, password_hash, first_name, last_name, risk_appetite FROM users WHERE email = ?', [email]);
    if (users.length === 0)
        return res.status(401).json({ error: 'Invalid credentials' });
    const user = users[0];
    const ok = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            riskAppetite: user.risk_appetite
        }
    });
});
const resetSchema = zod_1.z.object({ email: zod_1.z.string().email() });
exports.authRouter.post('/password-reset', async (req, res) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    // Simulate OTP generation and AI hint
    const otp = Math.floor(100000 + Math.random() * 900000);
    res.json({ message: 'OTP sent', otp, ai_feedback: 'Use a passphrase with numbers and symbols for better security.' });
});
// Logout endpoint (token is managed client-side; this is for logging and UX)
exports.authRouter.post('/logout', requireAuth, async (_req, res) => {
    res.json({ message: 'Logged out' });
});
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
        return res.status(401).json({ error: 'Missing token' });
    const token = auth.slice(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.userId = decoded.sub;
        req.userEmail = decoded.email;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
exports.authRouter.get('/me', requireAuth, async (req, res) => {
    const userId = req.userId;
    const users = await (0, database_1.executeQuery)('SELECT id, email, first_name, last_name, phone, risk_appetite, investment_goal, monthly_investment FROM users WHERE id = ?', [userId]);
    if (users.length === 0)
        return res.status(404).json({ error: 'User not found' });
    const user = users[0];
    res.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || '',
        riskAppetite: user.risk_appetite,
        investmentGoal: user.investment_goal || '',
        monthlyInvestment: user.monthly_investment ? user.monthly_investment.toString() : ''
    });
});
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    riskAppetite: zod_1.z.enum(['low', 'moderate', 'high']).optional(),
    investmentGoal: zod_1.z.string().optional(),
    monthlyInvestment: zod_1.z.number().positive().optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
    confirmPassword: zod_1.z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
exports.authRouter.put('/me', requireAuth, async (req, res) => {
    const userId = req.userId;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const updateData = parsed.data;
    const sets = [];
    const vals = [];
    // Build update query dynamically
    if (updateData.firstName !== undefined) {
        sets.push('first_name = ?');
        vals.push(updateData.firstName);
    }
    if (updateData.lastName !== undefined) {
        sets.push('last_name = ?');
        vals.push(updateData.lastName);
    }
    if (updateData.email !== undefined) {
        sets.push('email = ?');
        vals.push(updateData.email);
    }
    if (updateData.phone !== undefined) {
        sets.push('phone = ?');
        vals.push(updateData.phone);
    }
    if (updateData.riskAppetite !== undefined) {
        sets.push('risk_appetite = ?');
        vals.push(updateData.riskAppetite);
    }
    if (updateData.investmentGoal !== undefined) {
        sets.push('investment_goal = ?');
        vals.push(updateData.investmentGoal);
    }
    if (updateData.monthlyInvestment !== undefined) {
        sets.push('monthly_investment = ?');
        vals.push(updateData.monthlyInvestment);
    }
    if (sets.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }
    try {
        await (0, database_1.executeQuery)(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, userId]);
        // Return updated user data
        const users = await (0, database_1.executeQuery)('SELECT id, email, first_name, last_name, phone, risk_appetite, investment_goal, monthly_investment FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[0];
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone || '',
            riskAppetite: user.risk_appetite,
            investmentGoal: user.investment_goal || '',
            monthlyInvestment: user.monthly_investment ? user.monthly_investment.toString() : ''
        });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
exports.authRouter.post('/change-password', requireAuth, async (req, res) => {
    const userId = req.userId;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { currentPassword, newPassword } = parsed.data;
    try {
        // Get current user password
        const users = await (0, database_1.executeQuery)('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify current password
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, users[0].password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        // Hash new password
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        await (0, database_1.executeQuery)('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});
// 2FA Setup
exports.authRouter.post('/2fa/setup', requireAuth, async (req, res) => {
    const userId = req.userId;
    try {
        // Generate secret
        const secret = speakeasy_1.default.generateSecret({
            name: 'Grip Invest',
            issuer: 'Grip Invest',
            length: 32
        });
        // Generate QR code
        const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
        // Store secret temporarily (not enabled yet)
        await (0, database_1.executeQuery)('UPDATE users SET two_factor_secret = ? WHERE id = ?', [secret.base32, userId]);
        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32
        });
    }
    catch (error) {
        console.error('Error setting up 2FA:', error);
        res.status(500).json({ error: 'Failed to setup 2FA' });
    }
});
// Verify 2FA setup
exports.authRouter.post('/2fa/verify', requireAuth, async (req, res) => {
    const userId = req.userId;
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }
    try {
        // Get user's 2FA secret
        const users = await (0, database_1.executeQuery)('SELECT two_factor_secret FROM users WHERE id = ?', [userId]);
        if (users.length === 0 || !users[0].two_factor_secret) {
            return res.status(400).json({ error: '2FA not setup' });
        }
        // Verify token
        const verified = speakeasy_1.default.totp.verify({
            secret: users[0].two_factor_secret,
            encoding: 'base32',
            token: token,
            window: 2
        });
        if (verified) {
            // Enable 2FA
            await (0, database_1.executeQuery)('UPDATE users SET two_factor_enabled = true WHERE id = ?', [userId]);
            res.json({ message: '2FA enabled successfully' });
        }
        else {
            res.status(400).json({ error: 'Invalid token' });
        }
    }
    catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ error: 'Failed to verify 2FA' });
    }
});
// Disable 2FA
exports.authRouter.post('/2fa/disable', requireAuth, async (req, res) => {
    const userId = req.userId;
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }
    try {
        // Get user's 2FA secret
        const users = await (0, database_1.executeQuery)('SELECT two_factor_secret FROM users WHERE id = ?', [userId]);
        if (users.length === 0 || !users[0].two_factor_secret) {
            return res.status(400).json({ error: '2FA not setup' });
        }
        // Verify token
        const verified = speakeasy_1.default.totp.verify({
            secret: users[0].two_factor_secret,
            encoding: 'base32',
            token: token,
            window: 2
        });
        if (verified) {
            // Disable 2FA
            await (0, database_1.executeQuery)('UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = ?', [userId]);
            res.json({ message: '2FA disabled successfully' });
        }
        else {
            res.status(400).json({ error: 'Invalid token' });
        }
    }
    catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});
// Get 2FA status
exports.authRouter.get('/2fa/status', requireAuth, async (req, res) => {
    const userId = req.userId;
    try {
        const users = await (0, database_1.executeQuery)('SELECT two_factor_enabled FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            enabled: users[0].two_factor_enabled || false
        });
    }
    catch (error) {
        console.error('Error getting 2FA status:', error);
        res.status(500).json({ error: 'Failed to get 2FA status' });
    }
});
// Get login history
exports.authRouter.get('/login-history', requireAuth, async (req, res) => {
    const userId = req.userId;
    try {
        const logs = await (0, database_1.executeQuery)(`SELECT id, endpoint, http_method, status_code, created_at 
       FROM transaction_logs 
       WHERE user_id = ? AND endpoint LIKE '%/login%' 
       ORDER BY created_at DESC 
       LIMIT 50`, [userId]);
        const loginHistory = logs.map(log => ({
            id: log.id,
            endpoint: log.endpoint,
            method: log.http_method,
            status: log.status_code,
            timestamp: log.created_at,
            success: log.status_code >= 200 && log.status_code < 300
        }));
        res.json({ loginHistory });
    }
    catch (error) {
        console.error('Error getting login history:', error);
        res.status(500).json({ error: 'Failed to get login history' });
    }
});
// Save user preferences
const preferencesSchema = zod_1.z.object({
    emailNotifications: zod_1.z.boolean().optional(),
    smsNotifications: zod_1.z.boolean().optional(),
    marketUpdates: zod_1.z.boolean().optional(),
    portfolioAlerts: zod_1.z.boolean().optional(),
});
exports.authRouter.post('/preferences', requireAuth, async (req, res) => {
    const userId = req.userId;
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const preferences = parsed.data;
    try {
        // Store preferences in a JSON column or separate table
        // For now, we'll store as JSON in a text field
        await (0, database_1.executeQuery)('UPDATE users SET preferences = ? WHERE id = ?', [JSON.stringify(preferences), userId]);
        res.json({ message: 'Preferences saved successfully', preferences });
    }
    catch (error) {
        console.error('Error saving preferences:', error);
        res.status(500).json({ error: 'Failed to save preferences' });
    }
});
// Get user preferences
exports.authRouter.get('/preferences', requireAuth, async (req, res) => {
    const userId = req.userId;
    try {
        const users = await (0, database_1.executeQuery)('SELECT preferences FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const preferences = users[0].preferences ? JSON.parse(users[0].preferences) : {
            emailNotifications: true,
            smsNotifications: false,
            marketUpdates: true,
            portfolioAlerts: true,
        };
        res.json({ preferences });
    }
    catch (error) {
        console.error('Error getting preferences:', error);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});
