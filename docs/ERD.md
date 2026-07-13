# Delivery Buddy — Entity Relationship Diagram

## Mermaid Diagram

```mermaid
erDiagram
    Courier ||--o{ Shift : "1—N"
    Shift ||--o{ Order : "1—N"
    Courier ||--o{ Transaction : "1—N"
    Courier ||--o{ WalletWithdrawal : "1—N"
    Courier ||--o{ Order : "1—N (assigned courier)"
    Order ||--o{ Message : "1—N"
    RouteCache }o--|| Order : "cached lookups (keyed by pickup+destination)"

    Courier {
        string id PK
        string workId UK
        string email UK
        string passwordHash
        string name
        string avatarUrl
        string team
        int level
        float rate
        string transportationType
        string vehicleNumber
        string locationSettings
        string notificationSettings
        string billingMethod
        datetime createdAt
        datetime updatedAt
    }

    Shift {
        string id PK
        string courierId FK
        datetime startedAt
        datetime endedAt
        string status
        float totalEarned
        float totalTips
        int deliveriesCompleted
    }

    Order {
        string id PK
        string orderCode UK
        string status
        string pickupAddress
        string destinationAddress
        string customerName
        string customerPhone
        string itemsJson
        float totalAmount
        string paymentMethod
        float courierEarning
        float tip
        int etaMinutes
        float distanceRemainingKm
        string shiftId FK
        string courierId FK
        datetime createdAt
        datetime updatedAt
    }

    Transaction {
        string id PK
        string courierId FK
        string type
        float amount
        string relatedOrderId
        datetime createdAt
    }

    WalletWithdrawal {
        string id PK
        string courierId FK
        float amount
        string status
        datetime createdAt
    }

    Message {
        string id PK
        string orderId FK
        string senderType
        string text
        boolean seen
        datetime createdAt
    }

    RouteCache {
        string key PK
        float distanceKm
        int etaMinutes
        string polyline
        datetime cachedAt
        datetime expiresAt
    }
```

## Relationships Summary

| Relationship | Cardinality | Notes |
|---|---|---|
| Courier → Shift | 1 — N | A courier can have many shifts over time; only one active at a time. |
| Shift → Order | 1 — N | Orders are assigned to a shift. The active shift holds current + queued deliveries. |
| Courier → Transaction | 1 — N | Every earning, tip, and withdrawal is recorded as a ledger entry. |
| Courier → WalletWithdrawal | 1 — N | Withdrawal requests made by the courier. |
| Courier → Order | 1 — N | Orders are assigned to a specific courier. |
| Order → Message | 1 — N | Chat messages tied to a specific order/delivery. |
| RouteCache → (lookup) | — | Not a direct FK relationship; keyed by pickup+destination pair, referenced when computing routes for orders. |

## Enum Values

- **Courier.transportationType**: `bicycle` | `car` | `truck`
- **Shift.status**: `active` | `ended`
- **Order.status**: `assigned` | `in_transit` | `at_door` | `delivered` | `cancelled`
- **Order.paymentMethod**: `credit_card` | `cash` | `debit_card` | `wallet`
- **Transaction.type**: `earning` | `tip` | `withdrawal`
- **WalletWithdrawal.status**: `pending` | `completed` | `failed`
- **Message.senderType**: `courier` | `customer`
