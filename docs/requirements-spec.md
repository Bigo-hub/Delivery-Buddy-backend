# Delivery Buddy — Requirements Specification

## Overview

This document lists every endpoint in the Delivery Buddy API with its method,
path, auth requirement, parameters, and example request/response.

**Base URL**: `http://localhost:3000`
**Auth**: All endpoints except `/auth/*` require `Authorization: Bearer <JWT>`.

---

## 1. Auth

### POST /auth/signup
Register a new courier account.

- **Auth**: None
- **Body**:
  ```json
  {
    "email": "john@deliverybuddy.com",
    "password": "secret123",
    "workId": "#AF15697",
    "name": "John Doe",
    "team": "Team A",
    "transportationType": "car",
    "vehicleNumber": "ABC-123"
  }
  ```
- **Response 201**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "courier": {
      "id": "clx...",
      "workId": "#AF15697",
      "name": "John Doe",
      "email": "john@deliverybuddy.com",
      "level": 1,
      "rate": 0,
      "transportationType": "car",
      "vehicleNumber": "ABC-123",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  }
  ```
- **Errors**: `400` — email/workId already exists, validation error.

### POST /auth/login
Authenticate and receive a JWT.

- **Auth**: None
- **Body**:
  ```json
  { "email": "john@deliverybuddy.com", "password": "secret123" }
  ```
- **Response 200**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "courier": { "id": "clx...", "workId": "#AF15697", "name": "John Doe", ... }
  }
  ```
- **Errors**: `401` — invalid email or password.

### POST /auth/logout
Log out (stateless — client discards token).

- **Auth**: None
- **Response 200**:
  ```json
  { "message": "Logged out" }
  ```

---

## 2. Onboarding / Profile

### PUT /couriers/me/profile
Update onboarding/profile fields.

- **Auth**: Required
- **Body** (all fields optional):
  ```json
  {
    "workId": "#AF15697",
    "name": "John Doe",
    "team": "Team A",
    "transportationType": "car",
    "vehicleNumber": "ABC-123",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
  ```
- **Response 200**:
  ```json
  { "courier": { "id": "clx...", "workId": "#AF15697", "name": "John Doe", ... } }
  ```
- **Errors**: `400` — invalid transportationType; `409` — workId already taken.

### GET /couriers/me
Get the authenticated courier's full profile.

- **Auth**: Required
- **Response 200**:
  ```json
  { "courier": { "id": "clx...", "workId": "#AF15697", "name": "John Doe", "level": 3, "rate": 25, ... } }
  ```
- **Errors**: `401` — missing/invalid token.

### PATCH /couriers/me/settings
Update notification, location, and billing settings.

- **Auth**: Required
- **Body** (all fields optional):
  ```json
  {
    "locationSettings": "always_on",
    "notificationSettings": "push_enabled",
    "billingMethod": "weekly_bank_transfer"
  }
  ```
- **Response 200**:
  ```json
  { "courier": { "id": "clx...", "notificationSettings": "push_enabled", ... } }
  ```

---

## 3. Shifts

### POST /shifts/start
Start a new shift.

- **Auth**: Required
- **Body**: none
- **Response 201**:
  ```json
  {
    "shift": {
      "id": "clx...",
      "courierId": "clx...",
      "startedAt": "2025-01-15T10:00:00.000Z",
      "endedAt": null,
      "status": "active",
      "totalEarned": 0,
      "totalTips": 0,
      "deliveriesCompleted": 0
    }
  }
  ```
- **Errors**: `409` — a shift is already active.

### POST /shifts/:id/stop
Stop an active shift. Computes totals from delivered orders.

- **Auth**: Required
- **Path**: `id` — shift ID
- **Response 200**:
  ```json
  {
    "shift": {
      "id": "clx...",
      "status": "ended",
      "endedAt": "2025-01-15T14:00:00.000Z",
      "totalEarned": 45.50,
      "totalTips": 8.00,
      "deliveriesCompleted": 5
    }
  }
  ```
- **Errors**: `404` — shift not found; `409` — shift already ended.

### GET /shifts/current
Get the currently active shift with its orders.

- **Auth**: Required
- **Response 200**:
  ```json
  {
    "shift": {
      "id": "clx...",
      "status": "active",
      "startedAt": "2025-01-15T10:00:00.000Z",
      "orders": [ { "id": "clx...", "orderCode": "#403-540", "status": "in_transit", ... } ]
    }
  }
  ```
- **Errors**: `404` — no active shift.

### GET /shifts
Get shift history (paginated, ended shifts only).

- **Auth**: Required
- **Query**: `page` (default 1), `limit` (default 20)
- **Response 200**:
  ```json
  {
    "shifts": [ { "id": "clx...", "status": "ended", "totalEarned": 45.50, ... } ],
    "pagination": { "page": 1, "limit": 20, "total": 15, "totalPages": 1 }
  }
  ```

---

## 4. Orders / Deliveries

### GET /orders
List orders for the active shift, optionally filtered by status.

- **Auth**: Required
- **Query**: `status` (assigned | in_transit | at_door | delivered | cancelled), `page`, `limit`
- **Response 200**:
  ```json
  {
    "orders": [
      {
        "id": "clx...",
        "orderCode": "#403-540",
        "status": "in_transit",
        "pickupAddress": "123 Main St",
        "destinationAddress": "456 Oak Ave",
        "customerName": "Jane Smith",
        "customerPhone": "+1234567890",
        "items": [ { "name": "Pizza", "price": 15.99, "notes": "extra cheese" } ],
        "totalAmount": 18.99,
        "paymentMethod": "credit_card",
        "courierEarning": 4.50,
        "tip": 2.00
      }
    ],
    "activeShiftId": "clx...",
    "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
  }
  ```

### GET /orders/:id
Get a single order with full detail.

- **Auth**: Required
- **Path**: `id` — order ID
- **Response 200**:
  ```json
  {
    "order": {
      "id": "clx...",
      "orderCode": "#403-540",
      "status": "in_transit",
      "pickupAddress": "123 Main St",
      "destinationAddress": "456 Oak Ave",
      "customerName": "Jane Smith",
      "customerPhone": "+1234567890",
      "items": [ { "name": "Pizza", "price": 15.99, "notes": "extra cheese" } ],
      "totalAmount": 18.99,
      "paymentMethod": "credit_card",
      "courierEarning": 4.50,
      "tip": 2.00,
      "etaMinutes": 12,
      "distanceRemainingKm": 3.5,
      "shiftId": "clx...",
      "createdAt": "2025-01-15T10:05:00.000Z",
      "updatedAt": "2025-01-15T10:10:00.000Z"
    }
  }
  ```
- **Errors**: `404` — order not found.

### PATCH /orders/:id/status
Update order status with transition validation.

- **Auth**: Required
- **Path**: `id` — order ID
- **Body**:
  ```json
  { "status": "at_door" }
  ```
- **Valid transitions**:
  - `assigned` → `in_transit`, `cancelled`
  - `in_transit` → `at_door`, `delivered`, `cancelled`
  - `at_door` → `delivered`, `cancelled`
  - `delivered` → (terminal)
  - `cancelled` → (terminal)
- **Response 200**:
  ```json
  { "order": { "id": "clx...", "status": "at_door", ... } }
  ```
- **Errors**: `400` — invalid status value; `404` — order not found; `409` — invalid transition.

### GET /orders/:id/route
Get route/ETA for an order. Served from cache when fresh, otherwise fetched from the maps provider and cached.

- **Auth**: Required
- **Path**: `id` — order ID
- **Response 200**:
  ```json
  {
    "route": {
      "distanceKm": 3.5,
      "etaMinutes": 12,
      "polyline": "mock_polyline_12345_67890",
      "fromCache": true,
      "cachedAt": "2025-01-15T10:10:00.000Z"
    }
  }
  ```
- **Errors**: `404` — order not found.
- **Caching**: First call hits the provider (or mock). Subsequent calls within 60s return cached data with `fromCache: true`.

---

## 5. Wallet

### GET /wallet
Get wallet summary (balance, tips, rate, level).

- **Auth**: Required
- **Response 200**:
  ```json
  {
    "wallet": {
      "balance": 125.50,
      "tips": 32.00,
      "rate": 25,
      "level": 3
    }
  }
  ```

### GET /wallet/transactions
List wallet transactions (paginated, optionally filtered by type).

- **Auth**: Required
- **Query**: `type` (earning | tip | withdrawal), `page`, `limit`
- **Response 200**:
  ```json
  {
    "transactions": [
      {
        "id": "clx...",
        "courierId": "clx...",
        "type": "earning",
        "amount": 4.50,
        "relatedOrderId": "clx...",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
  }
  ```

### POST /wallet/withdraw
Withdraw funds from the wallet.

- **Auth**: Required
- **Body**:
  ```json
  { "amount": 50.00 }
  ```
- **Response 201**:
  ```json
  {
    "withdrawal": {
      "id": "clx...",
      "courierId": "clx...",
      "amount": 50.00,
      "status": "completed",
      "createdAt": "2025-01-15T11:00:00.000Z"
    },
    "newBalance": 75.50
  }
  ```
- **Errors**: `400` — insufficient balance or invalid amount.

---

## 6. Chat

### GET /orders/:id/messages
Get chat messages for an order (paginated).

- **Auth**: Required
- **Path**: `id` — order ID
- **Query**: `page`, `limit`
- **Response 200**:
  ```json
  {
    "messages": [
      {
        "id": "clx...",
        "orderId": "clx...",
        "senderType": "courier",
        "text": "I'm on my way!",
        "seen": true,
        "createdAt": "2025-01-15T10:15:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 5, "totalPages": 1 }
  }
  ```
- **Errors**: `404` — order not found.

### POST /orders/:id/messages
Send a message in an order chat.

- **Auth**: Required
- **Path**: `id` — order ID
- **Body**:
  ```json
  {
    "text": "I'm at the door!",
    "senderType": "courier"
  }
  ```
- **Response 201**:
  ```json
  {
    "message": {
      "id": "clx...",
      "orderId": "clx...",
      "senderType": "courier",
      "text": "I'm at the door!",
      "seen": false,
      "createdAt": "2025-01-15T10:20:00.000Z"
    }
  }
  ```
- **Errors**: `400` — empty text; `404` — order not found.

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "details": { }
}
```

| HTTP Status | When |
|---|---|
| `400` | Validation failure (missing/invalid body, params, query) |
| `401` | Missing or invalid JWT token |
| `404` | Resource not found (order, shift, route) |
| `409` | Conflict / invalid state transition |
| `500` | Unexpected server error |
