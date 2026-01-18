import { prisma } from '../config/database';
import { CartResponse, CartItemResponse } from '../types';

export class CartService {
  /**
   * Get or create cart for user
   */
  async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { category: true } } } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: { include: { category: true } } } } },
      });
    }

    return cart;
  }

  /**
   * Get cart with items
   */
  async getCart(userId: string): Promise<CartResponse> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      return {
        id: '',
        userId,
        items: [],
        totalItems: 0,
        totalAmount: '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return this.formatCartResponse(cart);
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, productId: string, quantity: number, variantId?: string): Promise<CartResponse> {
    // Validate product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // If variantId provided, validate and check variant stock
    let variant = null;
    if (variantId) {
      variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId, isActive: true },
      });

      if (!variant) {
        throw new Error('Variant not found');
      }

      if (variant.stockQuantity < quantity) {
        throw new Error('Insufficient variant stock');
      }
    } else {
      // Check product stock if no variant
      if (product.stockQuantity < quantity) {
        throw new Error('Insufficient stock');
      }
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Get or create cart for user
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart (considering variant)
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId || undefined,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const stockToCheck = variant ? variant.stockQuantity : product.stockQuantity;

      // Check stock availability for updated quantity
      if (stockToCheck < newQuantity) {
        throw new Error('Insufficient stock');
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(userId: string, itemId: string, quantity: number): Promise<CartResponse> {
    // Validate quantity is positive
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Find cart item with product and variant
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { 
        cart: true, 
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Verify item belongs to user's cart
    if (cartItem.cart.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Validate stock against variant or product
    if (cartItem.variantId && cartItem.variant) {
      if (cartItem.variant.stockQuantity < quantity) {
        throw new Error('Insufficient variant stock');
      }
    } else {
      if (cartItem.product.stockQuantity < quantity) {
        throw new Error('Insufficient stock');
      }
    }

    // Check stock availability
    if (cartItem.product.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Verify item belongs to user's cart
    if (cartItem.cart.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  }

  /**
   * Format cart response with calculated fields
   */
  private formatCartResponse(cart: any): CartResponse {
    let totalItems = 0;
    let totalAmount = 0;

    const items: CartItemResponse[] = cart.items.map((item: any) => {
      totalItems += item.quantity;

      // Use variant price if available, otherwise product price
      const price = item.variant?.price
        ? parseFloat(item.variant.price.toString())
        : parseFloat(item.product.price.toString());
      
      const discountPrice = item.variant?.discountPrice
        ? parseFloat(item.variant.discountPrice.toString())
        : item.product.discountPrice
        ? parseFloat(item.product.discountPrice.toString())
        : null;

      const finalPrice = discountPrice || price;
      const subtotal = finalPrice * item.quantity;

      totalAmount += subtotal;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0] || '',
        price: price.toString(),
        discountPrice: discountPrice ? discountPrice.toString() : undefined,
        quantity: item.quantity,
        subtotal: subtotal.toString(),
        variantId: item.variantId,
        variantName: item.variant?.name,
        variantAttributes: item.variant?.attributes,
        createdAt: item.createdAt,
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalItems,
      totalAmount: totalAmount.toString(),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}

export const cartService = new CartService();
