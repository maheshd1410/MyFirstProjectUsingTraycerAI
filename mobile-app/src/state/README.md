# State Management Documentation

This directory contains state management solutions for the Ladoo E-commerce mobile app. The app uses a layered approach with both Redux (production) and React Context (Phase 6 demo).

## Two Auth Systems

### 1. Production System (Redux)

**Location:** `src/store/auth/authSlice.ts`

**Features:**
- Backend API integration with real authentication
- Token persistence using AsyncStorage
- OAuth support (Google, Apple)
- Automatic token refresh
- Redux Toolkit for predictable state management

**Usage:**
```typescript
import { useAuth } from '../../hooks/useAuth';

const { user, isLoading, error, login, register, logout } = useAuth();
```

**When to use:**
- Production deployments
- Real user authentication
- Persistent storage requirements
- Complex auth flows with backend dependencies

---

### 2. Phase 6 Demo System (React Context)

**Location:** `src/state/auth.context.tsx`

**Features:**
- UI-only, in-memory state management
- No backend integration
- Simplified auth flow for demonstration
- Basic email/password validation
- Simulated 1-second login delay for realistic UX

**Usage:**
```typescript
import { useAuthContext } from '../../state/auth.context';

const { state, login, register, logout, updateUser, loading } = useAuthContext();
```

**When to use:**
- Phase 6 implementation
- UI demonstration and prototyping
- Educational purposes
- Testing without backend infrastructure

---

## Auth Context API

### Types

```typescript
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthContextState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
}
```

### Provider Usage

Wrap your app with `AuthProvider`:

```tsx
import { AuthProvider } from './state';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### Hook Usage

```tsx
import { useAuthContext } from './state';

function MyComponent() {
  const { state, login, register, logout, updateUser, loading } = useAuthContext();

  // Access current user
  const user = state.user;
  const isAuthenticated = state.isAuthenticated;

  // Login
  await login('user@example.com', 'password123');

  // Register
  await register('John Doe', 'john@example.com', 'password123');

  // Logout
  logout();

  // Update user
  updateUser({ name: 'Jane Doe' });
}
```

---

## Cart Context API

**Location:** `src/state/cart.context.tsx`

A local cart state management using React Context and useReducer.

### Types

```typescript
export interface LocalCartItem {
  id: string;                        // Unique identifier (productId-variantId)
  productId: string;
  productName: string;
  productImage: string;
  price: string;
  discountPrice?: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  variantAttributes?: Record<string, string>;
}
```

### Hook Usage

```tsx
import { useCart } from './state';

function CartScreen() {
  const { state, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();

  // Access cart items
  const items = state.items;
  const totalAmount = state.totalAmount;
  const totalQuantity = state.totalQuantity;

  // Add item to cart
  addToCart(cartItem);

  // Remove item by ID
  removeFromCart(itemId);

  // Update quantity
  updateQuantity(itemId, newQuantity);

  // Clear entire cart
  clearCart();
}
```

---

## Migration Path

### From Context to Redux

If migrating from Phase 6 Context to production Redux:

1. **Ensure Redux auth is configured** in `src/store/auth/authSlice.ts`
2. **Replace context hook with Redux hooks:**
   ```tsx
   // Before (Phase 6 Context)
   const { state, login } = useAuthContext();

   // After (Production Redux)
   const { user, isLoading } = useAuth();
   const dispatch = useAppDispatch();
   await dispatch(loginUser({ email, password })).unwrap();
   ```

3. **Update navigation logic** to use Redux selectors instead of context
4. **Move persistent data** from Redux to your backend

---

## Architecture Decision

The parallel system approach allows:

- **No disruption** to production code during Phase 6 development
- **Clear separation** between demo and real systems
- **Easy understanding** of phased development patterns
- **Gradual migration** path when needed

---

## Testing Checklist

- [x] Auth Provider wraps the app
- [x] Login with context creates authenticated session
- [x] Register creates new user
- [x] Logout clears auth state
- [x] Navigation responds to auth state changes
- [x] Profile displays current user data
- [x] Edit Profile updates user name
- [x] Cart items store with unique IDs
- [x] Cart handles variant collisions correctly
- [x] Forgot Password shows success message

---

## Files

- **auth.types.ts** - Type definitions for auth context
- **auth.context.tsx** - Auth provider and hooks
- **cart.types.ts** - Type definitions for cart context
- **cart.context.tsx** - Cart provider and hooks
- **index.ts** - Centralized exports

