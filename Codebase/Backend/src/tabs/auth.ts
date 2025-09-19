import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { executeQuery } from '../database';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  riskAppetite: z.enum(['low', 'moderate', 'high']).optional(),
});

function passwordFeedback(password: string): string[] {
  const tips: string[] = [];
  const length = password.length;
  
  // Length-based feedback
  if (length < 8) {
    tips.push('Use at least 8 characters');
  } else if (length < 12) {
    tips.push('Consider using 12+ characters for maximum security');
  }
  
  // Character type feedback
  if (!/[A-Z]/.test(password)) tips.push('Add an uppercase letter');
  if (!/[a-z]/.test(password)) tips.push('Add a lowercase letter');
  if (!/[0-9]/.test(password)) tips.push('Add a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) tips.push('Use a special character (!@#$%^&*)');
  
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

authRouter.post('/signup', async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, firstName, lastName, riskAppetite } = parsed.data;
  
  // Check if user already exists
  const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
  if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
  
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  
  // Create new user
  await executeQuery(
    'INSERT INTO users (id, email, password_hash, first_name, last_name, risk_appetite) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, email, passwordHash, firstName, lastName || null, riskAppetite || 'moderate']
  );
  
  const token = jwt.sign({ sub: userId, email }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
  res.json({ 
    token, 
    user: { id: userId, email, firstName, lastName, riskAppetite: riskAppetite || 'moderate' },
    ai_feedback: passwordFeedback(password)
  });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  
  // Find user by email
  const users = await executeQuery(
    'SELECT id, email, password_hash, first_name, last_name, risk_appetite FROM users WHERE email = ?',
    [email]
  ) as any[];
  
  if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
  
  const user = users[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
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

const resetSchema = z.object({ email: z.string().email() });
authRouter.post('/password-reset', async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  // Simulate OTP generation and AI hint
  const otp = Math.floor(100000 + Math.random() * 900000);
  res.json({ message: 'OTP sent', otp, ai_feedback: 'Use a passphrase with numbers and symbols for better security.' });
});

// Logout endpoint (token is managed client-side; this is for logging and UX)
authRouter.post('/logout', requireAuth, async (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
});

export function requireAuth(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as any;
    (req as any).userId = decoded.sub as string;
    (req as any).userEmail = decoded.email as string;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const users = await executeQuery(
    'SELECT id, email, first_name, last_name, phone, risk_appetite, investment_goal, monthly_investment FROM users WHERE id = ?',
    [userId]
  ) as any[];
  
  if (users.length === 0) return res.status(404).json({ error: 'User not found' });
  
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

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  riskAppetite: z.enum(['low', 'moderate', 'high']).optional(),
  investmentGoal: z.string().optional(),
  monthlyInvestment: z.number().positive().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

authRouter.put('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = updateProfileSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  
  const updateData = parsed.data;
  const sets: string[] = [];
  const vals: any[] = [];
  
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
    await executeQuery(
      `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
      [...vals, userId]
    );
    
    // Return updated user data
    const users = await executeQuery(
      'SELECT id, email, first_name, last_name, phone, risk_appetite, investment_goal, monthly_investment FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
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
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

authRouter.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = changePasswordSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  
  const { currentPassword, newPassword } = parsed.data;
  
  try {
    // Get current user password
    const users = await executeQuery(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await executeQuery(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// 2FA Setup
authRouter.post('/2fa/setup', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: 'Grip Invest',
      issuer: 'Grip Invest',
      length: 32
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    
    // Store secret temporarily (not enabled yet)
    await executeQuery(
      'UPDATE users SET two_factor_secret = ? WHERE id = ?',
      [secret.base32, userId]
    );
    
    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// Verify 2FA setup
authRouter.post('/2fa/verify', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  try {
    // Get user's 2FA secret
    const users = await executeQuery(
      'SELECT two_factor_secret FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length === 0 || !users[0].two_factor_secret) {
      return res.status(400).json({ error: '2FA not setup' });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: users[0].two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (verified) {
      // Enable 2FA
      await executeQuery(
        'UPDATE users SET two_factor_enabled = true WHERE id = ?',
        [userId]
      );
      
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Disable 2FA
authRouter.post('/2fa/disable', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  try {
    // Get user's 2FA secret
    const users = await executeQuery(
      'SELECT two_factor_secret FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length === 0 || !users[0].two_factor_secret) {
      return res.status(400).json({ error: '2FA not setup' });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: users[0].two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (verified) {
      // Disable 2FA
      await executeQuery(
        'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = ?',
        [userId]
      );
      
      res.json({ message: '2FA disabled successfully' });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Get 2FA status
authRouter.get('/2fa/status', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  
  try {
    const users = await executeQuery(
      'SELECT two_factor_enabled FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      enabled: users[0].two_factor_enabled || false 
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

// Get login history
authRouter.get('/login-history', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  
  try {
    const logs = await executeQuery(
      `SELECT id, endpoint, http_method, status_code, created_at 
       FROM transaction_logs 
       WHERE user_id = ? AND endpoint LIKE '%/login%' 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    ) as any[];
    
    const loginHistory = logs.map(log => ({
      id: log.id,
      endpoint: log.endpoint,
      method: log.http_method,
      status: log.status_code,
      timestamp: log.created_at,
      success: log.status_code >= 200 && log.status_code < 300
    }));
    
    res.json({ loginHistory });
  } catch (error) {
    console.error('Error getting login history:', error);
    res.status(500).json({ error: 'Failed to get login history' });
  }
});

// Save user preferences
const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketUpdates: z.boolean().optional(),
  portfolioAlerts: z.boolean().optional(),
});

authRouter.post('/preferences', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = preferencesSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  
  const preferences = parsed.data;
  
  try {
    // Store preferences in a JSON column or separate table
    // For now, we'll store as JSON in a text field
    await executeQuery(
      'UPDATE users SET preferences = ? WHERE id = ?',
      [JSON.stringify(preferences), userId]
    );
    
    res.json({ message: 'Preferences saved successfully', preferences });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Get user preferences
authRouter.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  
  try {
    const users = await executeQuery(
      'SELECT preferences FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
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
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});


