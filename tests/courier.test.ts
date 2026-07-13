import request from 'supertest';
import app from '../src/app';
import { setupTestDb } from './setup';
import { createTestCourier } from './helpers';

describe('Courier Endpoints', () => {
  let token: string;
  let courierId: string;

  beforeEach(async () => {
    await setupTestDb();
    const courier = await createTestCourier('courier');
    courierId = courier.id;
    const res = await request(app).post('/auth/login').send({
      email: 'testcourier@example.com',
      password: 'password123',
    });
    token = res.body.token;
  });

  describe('GET /couriers/me', () => {
    it('should return the courier profile', async () => {
      const res = await request(app)
        .get('/couriers/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.courier.id).toBe(courierId);
      expect(res.body.courier.workId).toBe('#TESTcourier');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/couriers/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/couriers/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /couriers/me/profile', () => {
    it('should update profile fields', async () => {
      const res = await request(app)
        .put('/couriers/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          transportationType: 'truck',
          vehicleNumber: 'XYZ-999',
        });

      expect(res.status).toBe(200);
      expect(res.body.courier.name).toBe('Updated Name');
      expect(res.body.courier.transportationType).toBe('truck');
      expect(res.body.courier.vehicleNumber).toBe('XYZ-999');
    });

    it('should return 400 for invalid transportationType', async () => {
      const res = await request(app)
        .put('/couriers/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ transportationType: 'motorcycle' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/couriers/me/profile')
        .send({ name: 'No Auth' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /couriers/me/settings', () => {
    it('should update settings', async () => {
      const res = await request(app)
        .patch('/couriers/me/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          notificationSettings: 'push_enabled',
          billingMethod: 'weekly_bank_transfer',
        });

      expect(res.status).toBe(200);
      expect(res.body.courier.notificationSettings).toBe('push_enabled');
      expect(res.body.courier.billingMethod).toBe('weekly_bank_transfer');
    });
  });
});
