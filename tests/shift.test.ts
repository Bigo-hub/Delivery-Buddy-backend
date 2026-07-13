import request from 'supertest';
import app from '../src/app';
import { setupTestDb } from './setup';
import { createTestCourier, createTestShift } from './helpers';

describe('Shift Endpoints', () => {
  let token: string;
  let courierId: string;

  beforeEach(async () => {
    await setupTestDb();
    const courier = await createTestCourier('shift');
    courierId = courier.id;
    const res = await request(app).post('/auth/login').send({
      email: 'testshift@example.com',
      password: 'password123',
    });
    token = res.body.token;
  });

  describe('POST /shifts/start', () => {
    it('should start a new shift with active status', async () => {
      const res = await request(app)
        .post('/shifts/start')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.shift.status).toBe('active');
      expect(res.body.shift.courierId).toBe(courierId);
      expect(res.body.shift.endedAt).toBeNull();
    });

    it('should return 409 if a shift is already active', async () => {
      await request(app).post('/shifts/start').set('Authorization', `Bearer ${token}`);
      const res = await request(app).post('/shifts/start').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(409);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/shifts/start');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /shifts/:id/stop', () => {
    it('should stop an active shift', async () => {
      const startRes = await request(app).post('/shifts/start').set('Authorization', `Bearer ${token}`);
      const shiftId = startRes.body.shift.id;

      const res = await request(app)
        .post(`/shifts/${shiftId}/stop`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.shift.status).toBe('ended');
      expect(res.body.shift.endedAt).not.toBeNull();
    });

    it('should return 404 for unknown shift', async () => {
      const res = await request(app)
        .post('/shifts/nonexistent/stop')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('should return 409 when stopping an already-ended shift', async () => {
      const startRes = await request(app).post('/shifts/start').set('Authorization', `Bearer ${token}`);
      const shiftId = startRes.body.shift.id;
      await request(app).post(`/shifts/${shiftId}/stop`).set('Authorization', `Bearer ${token}`);

      const res = await request(app).post(`/shifts/${shiftId}/stop`).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(409);
    });
  });

  describe('GET /shifts/current', () => {
    it('should return the active shift', async () => {
      await request(app).post('/shifts/start').set('Authorization', `Bearer ${token}`);
      const res = await request(app).get('/shifts/current').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.shift.status).toBe('active');
    });

    it('should return 404 when no active shift', async () => {
      const res = await request(app).get('/shifts/current').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /shifts', () => {
    it('should return shift history (paginated)', async () => {
      await createTestShift(courierId, 'ended');
      await createTestShift(courierId, 'ended');

      const res = await request(app).get('/shifts').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.shifts).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });
});
