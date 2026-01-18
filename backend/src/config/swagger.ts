import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ladoo Business API',
      version: '1.0.0',
      description: 'A comprehensive e-commerce API for the Ladoo Business mobile application',
      contact: {
        name: 'API Support',
        email: 'support@ladoobusiness.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.ladoobusiness.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            fullName: {
              type: 'string',
            },
            phoneNumber: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'ADMIN'],
            },
            isEmailVerified: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'phoneNumber'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            phoneNumber: {
              type: 'string',
              example: '+1234567890',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
            refreshToken: {
              type: 'string',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            imageUrl: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            price: {
              type: 'string',
            },
            discountPrice: {
              type: 'string',
              nullable: true,
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            category: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
              },
            },
            stockQuantity: {
              type: 'integer',
            },
            weight: {
              type: 'number',
            },
            unit: {
              type: 'string',
            },
            isFeatured: {
              type: 'boolean',
            },
            averageRating: {
              type: 'string',
            },
            totalReviews: {
              type: 'integer',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateProductRequest: {
          type: 'object',
          required: ['name', 'description', 'price', 'categoryId', 'stockQuantity', 'weight', 'unit'],
          properties: {
            name: {
              type: 'string',
              example: 'Premium Ladoo',
            },
            description: {
              type: 'string',
              example: 'Delicious handmade ladoo',
            },
            price: {
              type: 'number',
              example: 299.99,
            },
            discountPrice: {
              type: 'number',
              nullable: true,
              example: 249.99,
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['https://example.com/image1.jpg'],
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
            },
            stockQuantity: {
              type: 'integer',
              example: 100,
            },
            weight: {
              type: 'number',
              example: 500,
            },
            unit: {
              type: 'string',
              example: 'grams',
            },
            isFeatured: {
              type: 'boolean',
              example: false,
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            productId: {
              type: 'string',
            },
            quantity: {
              type: 'integer',
            },
            product: {
              $ref: '#/components/schemas/Product',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            total: {
              type: 'number',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            orderNumber: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            },
            totalAmount: {
              type: 'string',
            },
            shippingAddress: {
              type: 'object',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Address: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            phoneNumber: {
              type: 'string',
            },
            addressLine1: {
              type: 'string',
            },
            addressLine2: {
              type: 'string',
              nullable: true,
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
            postalCode: {
              type: 'string',
            },
            country: {
              type: 'string',
            },
            isDefault: {
              type: 'boolean',
            },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
            },
            comment: {
              type: 'string',
            },
            productId: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            isModerated: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
            isRead: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PaginatedProducts: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product',
              },
            },
            total: {
              type: 'integer',
            },
            page: {
              type: 'integer',
            },
            pageSize: {
              type: 'integer',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
