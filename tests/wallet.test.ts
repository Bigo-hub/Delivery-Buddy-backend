import request from 'supertest';
import app from '../src/app';
import { setupTestDb } from './setup';
import { createTestCourier, createTestTransaction } from './helpers';

describe('Wallet Endpoints', () => {
  let token: string;
  let courierId: string;

  beforeEach(async () => {
    await setupTestDb();
    const courier = await createTestCourier('wallet');
    courierId = courier.id;
    // Seed some earnings
    await createTestTransaction(courierId, 'earning', 100);
    await createTestTransaction(courierId, 'tip', 20);

    const res = await request(app).post('/auth/login').send({
      email: 'testwallet@example.com',
      password: 'password123',
    });
    token = res.body.token;
  });

  describe('GET /wallet', () => {
    it('should return wallet summary with balance, tips, rate, level', async () => {
      const res = await request(app).get('/wallet').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.wallet.balance).toBe(120);
      expect(res.body.wallet.tips).toBe(20);
      expect(res.body.wallet.rate).toBe(25);
      expect(res.body.wallet.level).toBe(3);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/wallet');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /wallet/transactions', () => {
    it('should list transactions', async () => {
      const res = await request(app)
        .get('/wallet/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/wallet/transactions?type=tip')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(1);
      expect(res.body.transactions[0].type).toBe('tip');
    });
  });

  describe('POST /wallet/withdraw', () => {
    it('should withdraw funds within balance', async () => {
      const res = await request(app)
        .post('/wallet/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50 });

      expect(res.status).toBe(201);
      expect(res.body.withdrawal.amount).toBe(50);
      expect(res.body.withdrawal.status).toBe('completed');
      expect(res.body.newBalance).toBe(70);
    });

    it('should reject withdrawal exceeding balance (400)', async () => {
      const res = await request(app)
        .post('/wallet/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 200 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Insufficient balance');
    });

    it('should reject zero or negative amount (400)', async () => {
      const res = await request(app)
        .post('/wallet/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 0 });

      expect(res.status).toBe(400);
    });

    it('should reject missing amount (400)', async () => {
      const res = await request(app)
        .post('/wallet/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
