import request from 'supertest';
import app from '../src/app';
import { setupTestDb } from './setup';
import { createTestCourier, createTestShift, createTestOrder } from './helpers';

describe('Chat Endpoints', () => {
  let token: string;
  let orderId: string;

  beforeEach(async () => {
    await setupTestDb();
    const courier = await createTestCourier('chat');
    const shift = await createTestShift(courier.id, 'active');
    const order = await createTestOrder(courier.id, shift.id);
    orderId = order.id;

    const res = await request(app).post('/auth/login').send({
      email: 'testchat@example.com',
      password: 'password123',
    });
    token = res.body.token;
  });

  describe('GET /orders/:id/messages', () => {
    it('should return messages (empty initially)', async () => {
      const res = await request(app)
        .get(`/orders/${orderId}/messages`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(0);
    });

    it('should return 404 for unknown order', async () => {
      const res = await request(app)
        .get('/orders/nonexistent/messages')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /orders/:id/messages', () => {
    it('should create a message', async () => {
      const res = await request(app)
        .post(`/orders/${orderId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'I am at the door!', senderType: 'courier' });

      expect(res.status).toBe(201);
      expect(res.body.message.text).toBe('I am at the door!');
      expect(res.body.message.senderType).toBe('courier');
      expect(res.body.message.seen).toBe(false);
    });

    it('should default senderType to courier', async () => {
      const res = await request(app)
        .post(`/orders/${orderId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Hello' });

      expect(res.status).toBe(201);
      expect(res.body.message.senderType).toBe('courier');
    });

    it('should return 400 for empty text', async () => {
      const res = await request(app)
        .post(`/orders/${orderId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: '' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for unknown order', async () => {
      const res = await request(app)
        .post('/orders/nonexistent/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Hello' });

      expect(res.status).toBe(404);
    });

    it('should list messages after creating', async () => {
      await request(app).post(`/orders/${orderId}/messages`).set('Authorization', `Bearer ${token}`).send({ text: 'Message 1' });
      await request(app).post(`/orders/${orderId}/messages`).set('Authorization', `Bearer ${token}`).send({ text: 'Message 2' });

      const res = await request(app)
        .get(`/orders/${orderId}/messages`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0].text).toBe('Message 1');
      expect(res.body.messages[1].text).toBe('Message 2');
    });
  });
});
