// ============================================
// Prüfstand Dashboard - Express SSE Server
// ============================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import { mockDataStream } from './services/MockDataStream';
import type { SSEClient, MockDataMode, GearPosition } from './types/server.types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:4321', 'http://localhost:3000', 'http://127.0.0.1:4321'],
  credentials: true,
}));
app.use(express.json());

// SSE Clients
const clients: Map<string, SSEClient> = new Map();

// ============================================
// SSE Stream Endpoint
// ============================================
app.get('/api/stream', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');

  // Initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Store client
  clients.set(clientId, {
    id: clientId,
    response: res,
    connectedAt: new Date(),
  });

  console.log(`[SSE] Client connected: ${clientId} (Total: ${clients.size})`);

  // Data stream interval
  const interval = setInterval(() => {
    try {
      const data = mockDataStream.generateData();
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`[SSE] Error sending data to ${clientId}:`, error);
    }
  }, 50); // 20 FPS

  // Cleanup on close
  req.on('close', () => {
    clearInterval(interval);
    clients.delete(clientId);
    console.log(`[SSE] Client disconnected: ${clientId} (Remaining: ${clients.size})`);
  });
});

// ============================================
// API Endpoints
// ============================================

// Get current mode
app.get('/api/mode', (_req: Request, res: Response) => {
  res.json({ mode: mockDataStream.getMode() });
});

// Set mode
app.post('/api/mode', (req: Request, res: Response) => {
  const { mode } = req.body as { mode: MockDataMode };
  if (mode === 'random' || mode === 'realistic') {
    mockDataStream.setMode(mode);
    console.log(`[API] Mode changed to: ${mode}`);
    res.json({ success: true, mode });
  } else {
    res.status(400).json({ error: 'Invalid mode' });
  }
});

// Set gear
app.post('/api/gear', (req: Request, res: Response) => {
  const { gear } = req.body as { gear: GearPosition };
  const validGears = ['R', 'N', '1', '2', '3', '4', '5', '6', '7'];
  if (validGears.includes(gear)) {
    mockDataStream.setGear(gear);
    console.log(`[API] Gear set to: ${gear}`);
    res.json({ success: true, gear });
  } else {
    res.status(400).json({ error: 'Invalid gear' });
  }
});

// Set target RPM
app.post('/api/rpm', (req: Request, res: Response) => {
  const { rpm } = req.body as { rpm: number };
  if (typeof rpm === 'number' && rpm >= 0 && rpm <= 12000) {
    mockDataStream.setTargetRPM(rpm);
    console.log(`[API] Target RPM set to: ${rpm}`);
    res.json({ success: true, rpm });
  } else {
    res.status(400).json({ error: 'Invalid RPM value' });
  }
});

// Reset
app.post('/api/reset', (_req: Request, res: Response) => {
  mockDataStream.reset();
  console.log('[API] Mock data stream reset');
  res.json({ success: true });
});

// Get status
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    clients: clients.size,
    mode: mockDataStream.getMode(),
    phase: mockDataStream.getCurrentPhase(),
    uptime: process.uptime(),
  });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log('============================================');
  console.log(`🚀 Prüfstand Backend Server`);
  console.log(`   Port: ${PORT}`);
  console.log(`   SSE Endpoint: http://localhost:${PORT}/api/stream`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log('============================================');
});

