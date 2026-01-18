# Manual API Testing Guide

---

## ⚡ TL;DR - Quick Token Guide

```
✅ FIXED: CSRF protection removed from public auth endpoints!

Step 1: Open Swagger UI
  → http://localhost:3000/api-docs
  → No CSRF token needed for register/login!

Step 2: Register (no auth token needed)
  → POST /api/auth/register with email/password
  → Copy "accessToken" from response

Step 3: Authorize in Swagger
  → Click "Authorize" button (green lock)
  → Paste: Bearer YOUR_TOKEN
  → Click Authorize

Step 4: Test any endpoint
  → All protected endpoints now work!
```

**Common Mistake**: Don't forget "Bearer " before the token!
- ✅ Correct: `Bearer eyJhbGc...`
- ❌ Wrong: `eyJhbGc...`

---

## 🔑 How to Get JWT Token for Testing

### IMPORTANT: You DON'T Need a Token to Register!

**Register is a PUBLIC endpoint** - Anyone can create an account without a token.

### The Correct Flow:

```
1. Register (Public, no token) → GET token in response
2. OR Login (Public, no token) → GET token in response  
3. Use that token → For all protected endpoints
```

### Step-by-Step to Get Your Token:

#### Option 1: Register New User (Recommended)
```bash
# In Swagger UI:
1. Find POST /api/auth/register
2. Click "Try it out"
3. Use this JSON:
{
  "email": "yourname@example.com",
  "password": "YourPassword123!",
  "firstName": "Your",
  "lastName": "Name",
  "phoneNumber": "1234567890"
}
4. Click "Execute"
5. COPY the "accessToken" from the response
```

#### Option 2: Login (If Already Registered)
```bash
# In Swagger UI:
1. Find POST /api/auth/login
2. Click "Try it out"
3. Use this JSON:
{
  "email": "yourname@example.com",
  "password": "YourPassword123!"
}
4. Click "Execute"
5. COPY the "accessToken" from the response
```

### Using Your Token:

1. Click the **"Authorize"** button (green lock icon at top)
2. Enter: `Bearer YOUR_TOKEN_HERE`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ⚠️ Include "Bearer" and the space!
3. Click "Authorize" then "Close"
4. ✅ Now all protected endpoints will work!

### Which Endpoints Need a Token?

**🔓 Public (No Token Needed):**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/products
- GET /api/products/{id}
- GET /api/categories

**🔒 Protected (Token Required):**
- POST /api/cart/items (add to cart)
- GET /api/cart (view cart)
- POST /api/orders (create order)
- POST /api/reviews (add review)
- All /api/admin/* endpoints

---

## ✅ Server Status
- **Dev Server Running**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api-docs
- **Database**: Connected (PostgreSQL)
- **Redis Cache**: Connected
- **Email Queue**: Initialized

---

## 🚀 Quick Start

### Visual Guide: Getting Your First Token

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Open Swagger UI                                │
│ http://localhost:3000/api-docs                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Register (NO TOKEN NEEDED!)                     │
│ POST /api/auth/register                                 │
│                                                          │
│ Request:                                                │
│ {                                                        │
│   "email": "test@example.com",                          │
│   "password": "Test123!",                               │
│   "firstName": "Test",                                  │
│   "lastName": "User",                                   │
│   "phoneNumber": "1234567890"                           │
│ }                                                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Response Contains Your Token!                           │
│ {                                                        │
│   "user": { ... },                                      │
│   "accessToken": "eyJhbGc...",  ← COPY THIS!            │
│   "refreshToken": "..."                                 │
│ }                                                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Click "Authorize" Button (Green Lock Icon)     │
│                                                          │
│ Enter: Bearer eyJhbGc...                                │
│         ↑      ↑                                        │
│         │      └─ Your actual token                     │
│         └─ Must include "Bearer " and space!            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ ✅ Done! Now test any protected endpoint                │
└─────────────────────────────────────────────────────────┘
```

### 1. Open Swagger UI
Navigate to: **http://localhost:3000/api-docs**

This interactive documentation allows you to test all API endpoints directly from your browser.

### 2. Authentication Flow
Most endpoints require authentication. Follow this sequence:

#### Step 1: Register a New User
- **Endpoint**: `POST /api/auth/register`
- **Click**: "Try it out"
- **Request Body**:
```json
{
  "email": "test@example.com",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "User",
  "phoneNumber": "1234567890"
}
```
- **Execute** and note the returned user data

#### Step 2: Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
```json
{
  "email": "test@example.com",
  "password": "Test123!"
}
```
- **Response** includes:
  - `accessToken` - Copy this!
  - `refreshToken`
  - User details

#### Step 3: Authorize Swagger
- Click the **"Authorize"** button at the top of Swagger UI
- In the "Value" field, paste: `Bearer YOUR_ACCESS_TOKEN_HERE`
  - Replace `YOUR_ACCESS_TOKEN_HERE` with the actual token from login
- Click **"Authorize"** then **"Close"**
- You're now authenticated for all protected endpoints!

---

## 📋 Testing Scenarios

### Scenario 1: Browse Products

#### 1.1 Get All Categories
- **Endpoint**: `GET /api/categories`
- **No auth required**
- **Result**: List of all product categories with images

#### 1.2 Get All Products
- **Endpoint**: `GET /api/products`
- **Query Parameters**:
  - `page`: 1
  - `pageSize`: 10
  - `search`: (optional) "chicken"
  - `categoryId`: (optional) Use ID from categories
  - `minPrice`: (optional) 0
  - `maxPrice`: (optional) 500
- **Result**: Paginated product list with categories

#### 1.3 Get Product Details
- **Endpoint**: `GET /api/products/{id}`
- **Path Parameter**: Use any product ID from previous response
- **Result**: Full product details including variants, category, ratings

#### 1.4 Get Featured Products
- **Endpoint**: `GET /api/products/featured`
- **Result**: Top 10 featured products

---

### Scenario 2: Shopping Cart Flow

#### 2.1 Add Item to Cart
- **Endpoint**: `POST /api/cart/items`
- **Requires Auth**: Yes
- **Request Body**:
```json
{
  "productId": "PRODUCT_ID_FROM_PREVIOUS_STEP",
  "quantity": 2
}
```
- **Result**: Cart with new item added

#### 2.2 View Cart
- **Endpoint**: `GET /api/cart`
- **Requires Auth**: Yes
- **Result**: Current cart with all items, quantities, and total

#### 2.3 Update Cart Item
- **Endpoint**: `PATCH /api/cart/items/{itemId}`
- **Path Parameter**: Cart item ID from view cart response
- **Request Body**:
```json
{
  "quantity": 3
}
```

#### 2.4 Remove Cart Item
- **Endpoint**: `DELETE /api/cart/items/{itemId}`
- **Path Parameter**: Cart item ID

---

### Scenario 3: Complete Order

#### 3.1 Create Address
- **Endpoint**: `POST /api/addresses`
- **Requires Auth**: Yes
- **Request Body**:
```json
{
  "fullName": "Test User",
  "phoneNumber": "1234567890",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "country": "India",
  "isDefault": true
}
```
- **Note**: Save the address ID from response

#### 3.2 Create Order
- **Endpoint**: `POST /api/orders`
- **Requires Auth**: Yes
- **Request Body**:
```json
{
  "addressId": "ADDRESS_ID_FROM_STEP_3.1",
  "paymentMethod": "COD",
  "specialInstructions": "Ring doorbell twice"
}
```
- **Payment Methods**: `COD`, `CARD`, `UPI`, `WALLET`
- **Result**: Order confirmation with order number

#### 3.3 View Orders
- **Endpoint**: `GET /api/orders`
- **Requires Auth**: Yes
- **Query Parameters**:
  - `page`: 1
  - `pageSize`: 10
  - `status`: (optional) `PENDING`, `CONFIRMED`, `DELIVERED`, etc.

#### 3.4 Get Order Details
- **Endpoint**: `GET /api/orders/{orderId}`
- **Path Parameter**: Order ID from create order
- **Result**: Full order details with items, address, status

---

### Scenario 4: Product Reviews

#### 4.1 Create Review
- **Endpoint**: `POST /api/reviews`
- **Requires Auth**: Yes (must have purchased the product)
- **Request Body**:
```json
{
  "productId": "PRODUCT_ID",
  "orderId": "ORDER_ID",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very fresh and good quality",
  "images": []
}
```

#### 4.2 Get Product Reviews
- **Endpoint**: `GET /api/products/{productId}/reviews`
- **Query Parameters**:
  - `page`: 1
  - `pageSize`: 10
  - `rating`: (optional) 5

---

### Scenario 5: Wishlist

#### 5.1 Add to Wishlist
- **Endpoint**: `POST /api/wishlist`
- **Requires Auth**: Yes
- **Request Body**:
```json
{
  "productId": "PRODUCT_ID"
}
```

#### 5.2 Get Wishlist
- **Endpoint**: `GET /api/wishlist`
- **Requires Auth**: Yes
- **Result**: All wishlisted products

#### 5.3 Remove from Wishlist
- **Endpoint**: `DELETE /api/wishlist/{productId}`
- **Path Parameter**: Product ID

---

### Scenario 6: Search & Filters

#### 6.1 Search Products
- **Endpoint**: `GET /api/search`
- **Query Parameters**:
  - `q`: "chicken breast"
  - `categoryId`: (optional)
  - `minPrice`: (optional)
  - `maxPrice`: (optional)
  - `minRating`: (optional)
  - `inStock`: true
  - `limit`: 10
  - `offset`: 0
- **Result**: Full-text search results with relevance scoring

#### 6.2 Get Search Suggestions
- **Endpoint**: `GET /api/search/suggestions`
- **Query Parameters**:
  - `q`: "chi"
- **Result**: Auto-complete suggestions

#### 6.3 Popular Searches
- **Endpoint**: `GET /api/search/popular`
- **Result**: Top 10 popular search terms

---

## 🔐 Admin Endpoints

### Create Admin User First

#### Option 1: Register as Admin (if first user)
Use the register endpoint with role:
```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "firstName": "Admin",
  "lastName": "User",
  "phoneNumber": "9876543210",
  "role": "ADMIN"
}
```

#### Option 2: Manually Update Database
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

### Admin Testing Scenarios

#### Admin Login
- Login with admin credentials
- Use the admin token for all admin endpoints

#### View All Orders (Admin)
- **Endpoint**: `GET /api/admin/orders`
- **Requires**: Admin auth
- **Query Parameters**:
  - `page`: 1
  - `pageSize`: 20
  - `status`: (optional)
  - `startDate`: (optional)
  - `endDate`: (optional)

#### Update Order Status
- **Endpoint**: `PATCH /api/admin/orders/{orderId}/status`
- **Request Body**:
```json
{
  "status": "CONFIRMED"
}
```
- **Statuses**: `PENDING` → `CONFIRMED` → `PREPARING` → `OUT_FOR_DELIVERY` → `DELIVERED`

#### Dashboard Analytics
- **Endpoint**: `GET /api/admin/analytics/dashboard`
- **Result**: Revenue, orders, popular products, category performance

---

## 🧪 Alternative Testing Tools

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get products with auth
curl -X GET "http://localhost:3000/api/products?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Add to cart
curl -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"productId":"PRODUCT_ID","quantity":2}'
```

### Using Postman

1. **Import Swagger Specification**:
   - Open Postman
   - File → Import
   - Import From Link: `http://localhost:3000/api-docs-json`

2. **Set Up Environment**:
   - Create new environment "Traycer Local"
   - Add variable:
     - `base_url`: http://localhost:3000
     - `access_token`: (will be set after login)

3. **Authorization**:
   - In request, go to "Authorization" tab
   - Type: Bearer Token
   - Token: `{{access_token}}`

---

## � Troubleshooting JWT Token Issues
### ❌ "Failed to fetch" or "CSRF token" errors

**Problem**: You get "Failed to fetch", "Cannot read properties of undefined (reading 'x-csrf-token')", or CSRF-related errors in Swagger UI

**Root Cause**: The backend has CSRF (Cross-Site Request Forgery) protection enabled for security

**Solutions**:

1. **✅ BEST: Use Swagger UI in a Web Browser** (RECOMMENDED)
   - Open http://localhost:3000/api-docs in Chrome/Edge/Firefox
   - Swagger UI automatically handles CSRF tokens via browser cookies
   - This is the easiest and recommended approach

2. **✅ If using cURL/Postman**: Get CSRF token first
   ```bash
   # Step 1: Get CSRF token
   curl -c cookies.txt -X GET http://localhost:3000/api/auth/csrf-token
   
   # Step 2: Use the token and cookies
   curl -b cookies.txt -H "x-csrf-token: TOKEN_FROM_STEP_1" \
     -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","phoneNumber":"1234567890"}'
   ```

3. **⚠️ For Development Only**: Temporarily disable CSRF
   - Not recommended for production
   - See CSRF configuration section below
### ❌ "Unauthorized" or "Invalid token"

**Problem**: You get 401 Unauthorized error

**Solutions**:
1. ✅ Make sure you included "Bearer " before the token
   - ✅ Correct: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ❌ Wrong: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (missing "Bearer ")
   - ❌ Wrong: `BearereyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (missing space)

2. ✅ Check if token expired
   - Tokens expire after 24 hours by default
   - Solution: Login again to get a fresh token

3. ✅ Copy the ENTIRE token
   - Token is very long (200+ characters)
   - Make sure you copied all of it

### ❌ "Cannot find user" or "User not registered"

**Problem**: Register fails with user already exists

**Solution**: Use a different email or login with existing credentials

### ❌ How to test as Admin?

**Problem**: Need admin privileges for certain endpoints

**Solution**:
1. Register normally
2. Use database client to update user role:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```
3. Login again to get new token with admin role

### ❌ "Cart is empty" when creating order

**Problem**: Trying to create order without items in cart

**Solution**: Add items to cart first:
1. POST /api/cart/items (add 1-2 products)
2. GET /api/cart (verify items are there)
3. POST /api/orders (now create order)

---

## �📊 Test Data Setup

### Seed Database
If you need test data:
```bash
cd backend
npm run seed
```

This creates:
- ✅ Categories (Fruits, Vegetables, Dairy, Meat, etc.)
- ✅ Products with variants
- ✅ Sample users
- ✅ Initial inventory

---

## 💻 Command Line Testing (cURL)

### Get Your JWT Token

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "1234567890"
  }'
```

**Response:**
```json
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

**Save the token:**
```bash
# Copy the accessToken from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Use Token for Protected Endpoints

**Get Cart (Protected):**
```bash
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

**Add to Cart (Protected):**
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "quantity": 2
  }'
```

**Create Order (Protected):**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID_HERE",
    "paymentMethod": "COD"
  }'
```

### Test Public Endpoints (No Token Needed)

**Get All Products:**
```bash
curl -X GET "http://localhost:3000/api/products?page=1&pageSize=10"
```

**Search Products:**
```bash
curl -X GET "http://localhost:3000/api/products?search=chicken&categoryId=CATEGORY_ID"
```

**Get Categories:**
```bash
curl -X GET http://localhost:3000/api/categories
```

---

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution**: 
1. Ensure you've logged in and copied the `accessToken`
2. Click "Authorize" in Swagger
3. Paste: `Bearer YOUR_TOKEN` (include "Bearer " prefix)

### Issue: "Product not found"
**Solution**: 
1. First call `GET /api/products` to get valid product IDs
2. Use those IDs in subsequent requests

### Issue: "Address required"
**Solution**: 
1. Create an address first using `POST /api/addresses`
2. Use the returned address ID in order creation

### Issue: "Cart is empty"
**Solution**: 
1. Add items to cart using `POST /api/cart/items`
2. Then create order

### Issue: Server not responding
**Solution**:
1. Check terminal for errors
2. Ensure PostgreSQL is running
3. Ensure Redis is running
4. Check `.env` file configuration

---

## 📈 Performance Testing

### Load Test with Apache Bench
```bash
# Test product list endpoint
ab -n 1000 -c 10 http://localhost:3000/api/products

# Test with auth (create auth-header file first)
ab -n 100 -c 5 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:3000/api/cart
```

### Monitor Cache Performance
Watch the terminal logs for:
- `Cache HIT` - Data served from Redis (fast)
- `Cache MISS` - Data fetched from database (slower)
- Cache warming on server startup

---

## 🎯 Key Test Checkpoints

### ✅ Must Test
- [ ] User registration and login
- [ ] Browse products with pagination
- [ ] Search products
- [ ] Add to cart and update quantities
- [ ] Create address
- [ ] Place order (COD)
- [ ] View order history
- [ ] Leave a review
- [ ] Admin: View all orders
- [ ] Admin: Update order status

### ✅ Edge Cases
- [ ] Empty cart checkout (should fail)
- [ ] Invalid product ID (should return 404)
- [ ] Duplicate email registration (should fail)
- [ ] Order without address (should fail)
- [ ] Review without purchase (should fail)
- [ ] Exceed stock quantity (should fail)

---

## 📝 Notes

- **Firebase Push Notifications**: May show warnings in logs if not configured (non-critical)
- **Email Queue**: Emails are queued but won't send without SMTP configuration
- **Stripe**: Running in TEST mode (use test card numbers)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Enabled for all origins in development

---

## 🚦 Server Commands

```bash
# Start development server
npm run dev

# Stop server
# Press Ctrl+C in terminal

# Build for production
npm run build

# Run tests
npm test                # All tests
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests
```

---

## 📞 Support

For issues:
1. Check terminal logs for errors
2. Verify database connection
3. Ensure all environment variables are set
4. Check Swagger UI for API documentation

Happy Testing! 🎉
