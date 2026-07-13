import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config';
import { setupTestDb } from './setup';
import { createTestCourier } from './helpers';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  describe('POST /auth/signup', () => {
    it('should create a new courier and return a token', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'newuser@example.com',
        password: 'password123',
        workId: '#NEW123',
        name: 'New User',
        transportationType: 'car',
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.courier.email).toBe('newuser@example.com');
      expect(res.body.courier.workId).toBe('#NEW123');
      expect(res.body.courier.passwordHash).toBeUndefined();
    });

    it('should return 400 for missing transportationType', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'newuser2@example.com',
        password: 'password123',
        workId: '#NEW456',
        name: 'New User 2',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for invalid transportationType', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'newuser3@example.com',
        password: 'password123',
        workId: '#NEW789',
        name: 'New User 3',
        transportationType: 'motorcycle',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'newuser4@example.com',
        password: '123',
        workId: '#NEW000',
        name: 'New User 4',
        transportationType: 'car',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for duplicate email', async () => {
      await createTestCourier('dup');
      const res = await request(app).post('/auth/signup').send({
        email: 'testdup@example.com',
        password: 'password123',
        workId: '#DUP999',
        name: 'Dup User',
        transportationType: 'car',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should return a token for valid credentials', async () => {
      await createTestCourier('login');
      const res = await request(app).post('/auth/login').send({
        email: 'testlogin@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.courier.email).toBe('testlogin@example.com');
    });

    it('should return 401 for invalid password', async () => {
      await createTestCourier('wrong');
      const res = await request(app).post('/auth/login').send({
        email: 'testwrong@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 200', async () => {
      const res = await request(app).post('/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out');
    });
  });
});
