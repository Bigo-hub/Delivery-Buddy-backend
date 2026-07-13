import request from 'supertest';
import app from '../src/app';
import { setupTestDb } from './setup';
import { createTestCourier, createTestShift, createTestOrder } from './helpers';
import { clearRouteCache } from '../src/services/routeCache';

describe('Order Endpoints', () => {
  let token: string;
  let courierId: string;
  let shiftId: string;
  let orderId: string;

  beforeEach(async () => {
    await setupTestDb();
    clearRouteCache();
    const courier = await createTestCourier('order');
    courierId = courier.id;
    const shift = await createTestShift(courierId, 'active');
    shiftId = shift.id;
    const order = await createTestOrder(courierId, shiftId, {
      pickupAddress: '123 Pickup St',
      destinationAddress: '456 Destination Ave',
    });
    orderId = order.id;

    const res = await request(app).post('/auth/login').send({
      email: 'testorder@example.com',
      password: 'password123',
    });
    token = res.body.token;
  });

  describe('GET /orders', () => {
    it('should list orders for the active shift', async () => {
      const res = await request(app).get('/orders').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.orders).toHaveLength(1);
      expect(res.body.orders[0].orderCode).toBeDefined();
      expect(res.body.activeShiftId).toBe(shiftId);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/orders?status=assigned')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.orders).toHaveLength(1);
      expect(res.body.orders[0].status).toBe('assigned');
    });

    it('should return empty for non-matching status', async () => {
      const res = await request(app)
        .get('/orders?status=delivered')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.orders).toHaveLength(0);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order detail', async () => {
      const res = await request(app)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.order.id).toBe(orderId);
      expect(res.body.order.items).toBeInstanceOf(Array);
      expect(res.body.order.items[0].name).toBe('Pizza');
    });

    it('should return 404 for unknown order', async () => {
      const res = await request(app)
        .get('/orders/nonexistent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should transition from assigned to in_transit', async () => {
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_transit' });

      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe('in_transit');
    });

    it('should transition from in_transit to at_door', async () => {
      await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_transit' });

      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'at_door' });

      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe('at_door');
    });

    it('should transition from at_door to delivered and record earnings', async () => {
      await request(app).patch(`/orders/${orderId}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'in_transit' });
      await request(app).patch(`/orders/${orderId}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'at_door' });

      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'delivered' });

      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe('delivered');
    });

    it('should return 409 for invalid transition (assigned → delivered)', async () => {
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'delivered' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Cannot transition');
    });

    it('should return 400 for invalid status value', async () => {
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'picked_up' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing status', async () => {
      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 for unknown order', async () => {
      const res = await request(app)
        .patch('/orders/nonexistent/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_transit' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /orders/:id/route', () => {
    it('should return route info on first call (fromCache: false)', async () => {
      const res = await request(app)
        .get(`/orders/${orderId}/route`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.route.distanceKm).toBeGreaterThan(0);
      expect(res.body.route.etaMinutes).toBeGreaterThan(0);
      expect(res.body.route.fromCache).toBe(false);
    });

    it('should return cached route on repeat call (fromCache: true)', async () => {
      const first = await request(app)
        .get(`/orders/${orderId}/route`)
        .set('Authorization', `Bearer ${token}`);
      const second = await request(app)
        .get(`/orders/${orderId}/route`)
        .set('Authorization', `Bearer ${token}`);

      expect(first.body.route.fromCache).toBe(false);
      expect(second.body.route.fromCache).toBe(true);
      expect(second.body.route.distanceKm).toBe(first.body.route.distanceKm);
      expect(second.body.route.etaMinutes).toBe(first.body.route.etaMinutes);
    });

    it('should return 404 for unknown order', async () => {
      const res = await request(app)
        .get('/orders/nonexistent/route')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
