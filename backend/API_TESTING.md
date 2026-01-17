# Ladoo Business API Testing Guide

Complete testing guide for all API endpoints with example requests, expected responses, and authentication flows.

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Product Endpoints](#product-endpoints)
3. [Category Endpoints](#category-endpoints)
4. [Cart Endpoints](#cart-endpoints)
5. [Address Endpoints](#address-endpoints)
6. [Order Endpoints](#order-endpoints)
7. [Payment Endpoints](#payment-endpoints)
8. [Health & Status](#health--status)
9. [Error Handling](#error-handling)
10. [JWT Authentication Middleware](#jwt-authentication-middleware)
11. [Stripe Integration Testing](#stripe-integration-testing)
12. [Testing Checklist](#testing-checklist)

---

## Authentication Endpoints

All authentication-related endpoints are defined in `src/routes/auth.ts` and handled by `src/controllers/auth.controller.ts`.

### POST /api/auth/register
**Description**: Register a new user account

**Request**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890"
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890",
    "role": "CUSTOMER",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Implementation Details**:
- Password is hashed using bcrypt via `AuthService.register()`
- JWT tokens are generated and returned
- User role defaults to CUSTOMER

**Error Responses**:
- 400: Invalid email format or weak password
- 409: Email already exists

---

### POST /api/auth/login
**Description**: Authenticate user and get JWT tokens

**Request**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "CUSTOMER"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Implementation Details**:
- Password is verified using bcrypt comparison
- Two tokens are returned: `accessToken` (short-lived, ~15 minutes) and `refreshToken` (long-lived)
- Refresh token is stored in database

**Error Responses**:
- 401: Invalid email or password
- 404: User not found

**Next Step**: Save the `accessToken` for use in protected routes

---

### GET /api/auth/me
**Description**: Get current authenticated user details

**Request**:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890",
    "role": "CUSTOMER",
    "isActive": true,
    "profileImage": null,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required (Bearer token)

**Middleware**: `authenticate` - validates JWT token

**Error Responses**:
- 401: Missing or invalid authorization header
- 401: Invalid or expired token

---

### POST /api/auth/refresh-token
**Description**: Refresh access token using refresh token

**Request**:
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Implementation Details**:
- Validates refresh token signature and expiration
- Generates new access token and refresh token
- Old refresh token is replaced in database

**Error Responses**:
- 400: Missing refresh token
- 401: Invalid or expired refresh token

---

### POST /api/auth/logout
**Description**: Logout user and invalidate refresh token

**Request**:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Authentication**: ✅ Required (Bearer token)

**Implementation Details**:
- Clears refresh token from database
- Token is no longer valid for refresh operations

**Error Responses**:
- 401: Missing or invalid authorization header

---

## Product Endpoints

Product endpoints are defined in `src/routes/product.ts` and handled by `src/controllers/product.controller.ts`.

### GET /api/products
**Description**: Get all products with optional filtering and pagination

**Request**:
```bash
# Get all products
curl http://localhost:3000/api/products

# With pagination
curl "http://localhost:3000/api/products?page=1&limit=10"

# Get products by category
curl "http://localhost:3000/api/products?categoryId=CATEGORY_ID"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "name": "Motichur Ladoo",
      "description": "Traditional motichur ladoos",
      "price": 250,
      "discountPrice": null,
      "images": [],
      "weight": "500g",
      "unit": "BOX",
      "stockQuantity": 50,
      "isFeatured": false,
      "averageRating": 4.5,
      "totalReviews": 10,
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-01-15T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**Authentication**: ❌ Not required

---

### GET /api/products/featured
**Description**: Get featured products

**Request**:
```bash
curl http://localhost:3000/api/products/featured
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "name": "Premium Peda Ladoo",
      "description": "Premium quality peda ladoos",
      "price": 350,
      "discountPrice": 300,
      "isFeatured": true,
      "stockQuantity": 30,
      "averageRating": 4.8,
      "totalReviews": 25,
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-01-15T..."
    }
  ]
}
```

**Authentication**: ❌ Not required

---

### GET /api/products/:id
**Description**: Get specific product by ID

**Request**:
```bash
curl http://localhost:3000/api/products/PRODUCT_ID
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "categoryId": "category-uuid",
    "name": "Besan Ladoo",
    "description": "Traditional besan ladoos",
    "price": 200,
    "discountPrice": null,
    "images": [],
    "weight": "400g",
    "unit": "BOX",
    "stockQuantity": 75,
    "lowStockThreshold": 10,
    "isActive": true,
    "isFeatured": true,
    "averageRating": 4.6,
    "totalReviews": 15,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ❌ Not required

**Error Responses**:
- 404: Product not found

---

### POST /api/products
**Description**: Create new product (Admin only)

**Request**:
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Ladoo Box",
    "description": "Delicious traditional ladoos",
    "price": 29.99,
    "discountPrice": null,
    "categoryId": "CATEGORY_ID",
    "stockQuantity": 100,
    "weight": "500g",
    "unit": "BOX",
    "images": ["https://example.com/image.jpg"],
    "isFeatured": false
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "new-product-uuid",
    "name": "Premium Ladoo Box",
    "description": "Delicious traditional ladoos",
    "price": 29.99,
    "stockQuantity": 100,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required (Admin token)

**Middleware**: `authenticate` + `requireRole('ADMIN')`

**Error Responses**:
- 400: Invalid request body or missing required fields
- 401: Missing or invalid token
- 403: Insufficient permissions (not admin)

---

## Category Endpoints

Category endpoints are defined in `src/routes/category.ts` and handled by `src/controllers/category.controller.ts`.

### GET /api/categories
**Description**: Get all product categories

**Request**:
```bash
curl http://localhost:3000/api/categories
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "category-uuid",
      "name": "Traditional Ladoos",
      "description": "Traditional ladoos and sweets",
      "imageUrl": null,
      "isActive": true,
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-01-15T..."
    },
    {
      "id": "category-uuid-2",
      "name": "Premium Ladoos",
      "description": "Premium quality ladoos",
      "imageUrl": null,
      "isActive": true,
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-01-15T..."
    }
  ]
}
```

**Authentication**: ❌ Not required

---

### GET /api/categories/:id
**Description**: Get specific category by ID

**Request**:
```bash
curl http://localhost:3000/api/categories/CATEGORY_ID
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "category-uuid",
    "name": "Traditional Ladoos",
    "description": "Traditional ladoos and sweets",
    "imageUrl": null,
    "isActive": true,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ❌ Not required

**Error Responses**:
- 404: Category not found

---

### POST /api/categories
**Description**: Create new category (Admin only)

**Request**:
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Festival Specials",
    "description": "Special ladoos for festivals",
    "imageUrl": null
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "new-category-uuid",
    "name": "Festival Specials",
    "description": "Special ladoos for festivals",
    "imageUrl": null,
    "isActive": true,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required (Admin token)

**Error Responses**:
- 400: Invalid request body
- 401: Missing or invalid token
- 403: Insufficient permissions

---

## Cart Endpoints

Cart endpoints are defined in `src/routes/cart.ts` and handled by `src/controllers/cart.controller.ts`. All cart endpoints require authentication.

### GET /api/cart
**Description**: Get user's cart with all items

**Request**:
```bash
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "items": [
      {
        "id": "cart-item-uuid",
        "cartId": "cart-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "product": {
          "id": "product-uuid",
          "name": "Motichur Ladoo",
          "price": 250,
          "discountPrice": null
        },
        "createdAt": "2026-01-15T...",
        "updatedAt": "2026-01-15T..."
      }
    ],
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required (Bearer token)

---

### POST /api/cart/items
**Description**: Add item to user's cart

**Request**:
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 2
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": "cart-item-uuid",
    "cartId": "cart-uuid",
    "productId": "product-uuid",
    "quantity": 2,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required

**Error Responses**:
- 400: Invalid product ID or quantity
- 404: Product not found

---

### PUT /api/cart/items/:id
**Description**: Update cart item quantity

**Request**:
```bash
curl -X PUT http://localhost:3000/api/cart/items/CART_ITEM_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {
    "id": "cart-item-uuid",
    "quantity": 3,
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required

**Error Responses**:
- 400: Invalid quantity
- 404: Cart item not found

---

### DELETE /api/cart/items/:id
**Description**: Remove item from cart

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/cart/items/CART_ITEM_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

**Authentication**: ✅ Required

---

### DELETE /api/cart
**Description**: Clear all items from cart

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

**Authentication**: ✅ Required

---

## Address Endpoints

Address endpoints are defined in `src/routes/address.ts` and handled by `src/controllers/address.controller.ts`. All address endpoints require authentication.

### GET /api/addresses
**Description**: Get user's addresses

**Request**:
```bash
curl http://localhost:3000/api/addresses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "address-uuid",
      "userId": "user-uuid",
      "fullName": "Test User",
      "phoneNumber": "+1234567890",
      "addressLine1": "123 Main St",
      "addressLine2": null,
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India",
      "isDefault": true,
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-01-15T..."
    }
  ]
}
```

**Authentication**: ✅ Required

---

### POST /api/addresses
**Description**: Create new address

**Request**:
```bash
curl -X POST http://localhost:3000/api/addresses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phoneNumber": "+1234567890",
    "addressLine1": "456 Oak Ave",
    "addressLine2": "Apt 5",
    "city": "Bangalore",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India",
    "isDefault": false
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "id": "new-address-uuid",
    "fullName": "Test User",
    "phoneNumber": "+1234567890",
    "addressLine1": "456 Oak Ave",
    "city": "Bangalore",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India",
    "isDefault": false,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required

**Error Responses**:
- 400: Invalid request body or missing required fields

---

### PUT /api/addresses/:id/default
**Description**: Set address as default

**Request**:
```bash
curl -X PUT http://localhost:3000/api/addresses/ADDRESS_ID/default \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Default address updated",
  "data": {
    "id": "address-uuid",
    "fullName": "Test User",
    "isDefault": true,
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required

**Error Responses**:
- 404: Address not found

---

## Order Endpoints

Order endpoints are defined in `src/routes/order.ts` and handled by `src/controllers/order.controller.ts`.

### POST /api/orders
**Description**: Create new order

**Request**:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "items": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 2,
        "price": 250
      }
    ]
  }'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "addressId": "address-uuid",
    "status": "PENDING",
    "totalAmount": 500,
    "items": [
      {
        "id": "order-item-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "price": 250,
        "product": {
          "name": "Motichur Ladoo"
        }
      }
    ],
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required

**Error Responses**:
- 400: Invalid address or items
- 404: Address or product not found

---

### GET /api/orders
**Description**: Get user's orders

**Request**:
```bash
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "order-uuid",
      "userId": "user-uuid",
      "status": "PENDING",
      "totalAmount": 500,
      "items": [],
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-01-15T..."
    }
  ]
}
```

**Authentication**: ✅ Required

---

### GET /api/orders/:id
**Description**: Get specific order by ID

**Request**:
```bash
curl http://localhost:3000/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "addressId": "address-uuid",
    "status": "PENDING",
    "totalAmount": 500,
    "items": [
      {
        "id": "order-item-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "price": 250
      }
    ],
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required

**Error Responses**:
- 404: Order not found or access denied

---

### PUT /api/orders/:id/status
**Description**: Update order status (Admin only)

**Request**:
```bash
curl -X PUT http://localhost:3000/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PROCESSING"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "order-uuid",
    "status": "PROCESSING",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required (Admin token)

**Valid Status Values**: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`

**Error Responses**:
- 400: Invalid status
- 401: Missing or invalid token
- 403: Insufficient permissions
- 404: Order not found

---

## Payment Endpoints

Payment endpoints are defined in `src/routes/payment.ts` and handled by `src/controllers/payment.controller.ts`.

### POST /api/payment/create-payment-intent
**Description**: Create Stripe payment intent for an order

**Request**:
```bash
curl -X POST http://localhost:3000/api/payment/create-payment-intent \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "amount": 5999
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdefghijklmnop",
    "paymentIntentId": "pi_1234567890",
    "amount": 5999,
    "currency": "INR",
    "status": "requires_payment_method"
  }
}
```

**Authentication**: ✅ Required (Bearer token)

**Implementation Details**:
- Creates Stripe payment intent using `PaymentService`
- Amount should be in lowest currency unit (paise for INR)
- Client secret is used by mobile app to complete payment

**Error Responses**:
- 400: Invalid amount or order ID
- 401: Missing or invalid token
- 404: Order not found
- 500: Stripe API error

---

### GET /api/payment/order/:orderId
**Description**: Get payment details for an order

**Request**:
```bash
curl http://localhost:3000/api/payment/order/ORDER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "userId": "user-uuid",
    "amount": 5999,
    "currency": "INR",
    "status": "COMPLETED",
    "paymentMethod": "card",
    "stripePaymentIntentId": "pi_1234567890",
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  }
}
```

**Authentication**: ✅ Required

**Error Responses**:
- 404: Payment not found

---

## Health & Status

### GET /health
**Description**: Health check endpoint (no authentication required)

**Request**:
```bash
curl http://localhost:3000/health
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "message": "Ladoo Business API is running",
  "timestamp": "2026-01-15T13:30:00Z"
}
```

**Purpose**: Verify server is running and responding

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
Invalid request body or missing required fields:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

#### 401 Unauthorized
Missing or invalid authentication:
```json
{
  "success": false,
  "error": "Missing or invalid authorization header"
}
```

#### 403 Forbidden
Insufficient permissions:
```json
{
  "success": false,
  "error": "Forbidden - insufficient permissions"
}
```

#### 404 Not Found
Resource not found:
```json
{
  "success": false,
  "error": "Resource not found"
}
```

#### 500 Server Error
Internal server error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## JWT Authentication Middleware

All protected endpoints use the `authenticate` middleware defined in `src/middleware/auth.ts`.

### Test Missing Token

**Request**:
```bash
curl http://localhost:3000/api/auth/me
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Missing or invalid authorization header"
}
```

---

### Test Invalid Token

**Request**:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid token"
}
```

---

### Test Expired Token

1. Generate a token with short expiry
2. Wait for it to expire
3. Use the token on a protected endpoint

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Access token expired"
}
```

---

### Test Role-Based Authorization

**Request** (Customer token on admin endpoint):
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_CUSTOMER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "price": 100,
    "categoryId": "cat-id"
  }'
```

**Expected Response** (403 Forbidden):
```json
{
  "success": false,
  "error": "Forbidden - insufficient permissions"
}
```

---

## Stripe Integration Testing

### Verify Stripe Configuration

Check server startup logs:
```
✓ Database connected successfully
✓ Stripe client initialized in TEST mode
Server running on port 3000
```

This confirms `src/config/stripe.ts` is properly configured with `STRIPE_SECRET_KEY`.

### Test Payment Intent Creation

**Request**:
```bash
curl -X POST http://localhost:3000/api/payment/create-payment-intent \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "amount": 5999
  }'
```

**Expected Response**: Status 200 with `clientSecret` from Stripe

### Verify in Stripe Dashboard

1. Go to https://dashboard.stripe.com (test mode)
2. Navigate to Payments section
3. You should see the payment intent created with status `requires_payment_method`

### Test Card Numbers (Stripe Test Mode)

| Card Number | Exp | CVC | Result |
|---|---|---|---|
| 4242 4242 4242 4242 | 12/26 | 123 | Successful payment |
| 4000 0000 0000 0002 | 12/26 | 123 | Card declined |
| 5555 5555 5555 4444 | 12/26 | 123 | Successful payment (Mastercard) |

---

## Testing Checklist

### Server Startup
- [ ] Dependencies installed successfully (`npm install` completes without errors)
- [ ] Server starts without errors (`npm run dev`)
- [ ] Database connection established (console shows connection success)
- [ ] Stripe client initialized (console shows initialization)
- [ ] Server listening on port 3000

### Authentication
- [ ] User registration works (POST /api/auth/register - 201 Created)
- [ ] User login works (POST /api/auth/login - 200 OK)
- [ ] JWT tokens generated correctly (tokens are non-empty strings)
- [ ] Token refresh mechanism works (POST /api/auth/refresh-token - 200 OK)
- [ ] Logout clears refresh token (POST /api/auth/logout - 200 OK)
- [ ] Protected routes require authentication (without token - 401)
- [ ] Invalid tokens are rejected (401 Invalid token)

### Authorization
- [ ] Admin-only routes reject customer tokens (403 Forbidden)
- [ ] Role-based access control works (customer cannot POST /api/products)
- [ ] Admin can create products and categories

### API Endpoints
- [ ] Product endpoints: GET all, GET by ID, GET featured (all return 200)
- [ ] Product creation (POST) by admin (201 Created)
- [ ] Category endpoints: GET all, GET by ID (all return 200)
- [ ] Category creation (POST) by admin (201 Created)
- [ ] Cart endpoints: GET, POST item, PUT quantity, DELETE item (all work)
- [ ] Address endpoints: GET, POST, PUT default (all work)
- [ ] Order endpoints: POST, GET, GET by ID (all work)
- [ ] Order status update (PUT) by admin (200 OK)
- [ ] Payment endpoint: POST create-payment-intent (200 OK with clientSecret)

### Stripe Integration
- [ ] Stripe client configured correctly (startup log shows initialized)
- [ ] Payment intents can be created (status 200 with clientSecret)
- [ ] Test mode is active (using test keys `sk_test_*`)
- [ ] Payment appears in Stripe dashboard

### Error Handling
- [ ] Invalid email format returns 400
- [ ] Missing required fields return 400
- [ ] Missing authentication returns 401
- [ ] Invalid token returns 401
- [ ] Insufficient permissions return 403
- [ ] Non-existent resources return 404
- [ ] Server errors return 500

### Database
- [ ] Prisma Client generated successfully
- [ ] Database migrations applied
- [ ] Database seeded with initial data
- [ ] Queries execute successfully
- [ ] User creation/retrieval works

---

## Testing Workflow

### 1. Complete Registration and Login Flow

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workflow@example.com",
    "password": "Test123!@#",
    "firstName": "Workflow",
    "lastName": "User",
    "phoneNumber": "+1234567890"
  }'

# Save the accessToken from response
export ACCESS_TOKEN="eyJ..."

# Verify user (GET /me)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get products
curl http://localhost:3000/api/products

# Add product to cart
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID", "quantity": 2}'

# Create address
curl -X POST http://localhost:3000/api/addresses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Test User", "phoneNumber": "+1234567890", "addressLine1": "123 Main St", "city": "Mumbai", "state": "Maharashtra", "postalCode": "400001", "country": "India", "isDefault": true}'

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"addressId": "ADDRESS_ID", "items": [{"productId": "PRODUCT_ID", "quantity": 2, "price": 250}]}'

# Create payment intent
curl -X POST http://localhost:3000/api/payment/create-payment-intent \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_ID", "amount": 5999}'
```

---

## Recommended Testing Tools

### 1. Postman
- **Pros**: Complete API testing, collection management, environment variables, automated tests
- **Cons**: Requires desktop app or login
- **Setup**: Import cURL commands as Postman requests, create environment with `ACCESS_TOKEN` variable

### 2. Thunder Client (VS Code)
- **Pros**: Lightweight, VS Code integrated, no login required
- **Cons**: Limited compared to Postman
- **Setup**: Install extension, create requests in VS Code

### 3. REST Client (VS Code)
- **Pros**: Simple, file-based, version control friendly
- **Cons**: Basic features
- **Setup**: Create `.http` files with requests

### 4. curl (Command Line)
- **Pros**: No setup, works everywhere
- **Cons**: Manual testing only
- **Use**: Perfect for quick endpoint testing

---

## Security Headers Verification

Check security headers in response:

```bash
curl -I http://localhost:3000/health
```

**Expected Headers** (added by Helmet middleware):
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Performance Testing (Optional)

### Health Endpoint Load Test

```bash
# Apache Bench (requires installation)
ab -n 1000 -c 10 http://localhost:3000/health
```

**Expected Results**:
- Response time: < 100ms
- Requests per second: > 500
- Error rate: 0%

---

## Troubleshooting

### Server Won't Start
1. Check if port 3000 is already in use: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
2. Verify DATABASE_URL in `.env`
3. Ensure PostgreSQL is running: `docker-compose ps`
4. Regenerate Prisma Client: `npx prisma generate`

### Database Connection Error
1. Verify Docker container: `docker-compose ps`
2. Check DATABASE_URL format
3. Test connection: `npm run test:db`
4. View logs: `docker-compose logs postgres`

### JWT Token Error
1. Verify JWT_SECRET is set in `.env`
2. Token format must be: `Authorization: Bearer <token>`
3. Check token expiration time

### Stripe Integration Error
1. Verify STRIPE_SECRET_KEY is set in `.env`
2. Use test mode keys (start with `sk_test_`)
3. Check Stripe dashboard for configuration
4. Ensure Stripe package is installed: `npm list stripe`

---

## Next Steps

After completing all tests:
1. Document any issues encountered and their resolutions
2. Create a list of working vs. non-working endpoints
3. Fix any failing endpoints before mobile app integration
4. Set up automated API tests using Jest and Supertest
5. Configure CI/CD pipeline for continuous testing
6. Prepare backend for production deployment
