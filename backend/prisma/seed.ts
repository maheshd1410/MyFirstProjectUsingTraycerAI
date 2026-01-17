import { prisma } from '../src/config/database';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Starting database seeding...\n');

  try {
    // Create categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Sweets' },
        update: {},
        create: {
          name: 'Sweets',
          description: 'Traditional Indian sweets and ladoos made with authentic recipes',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { name: 'Snacks' },
        update: {},
        create: {
          name: 'Snacks',
          description: 'Savory snacks and namkeen for all occasions',
          isActive: true,
        },
      }),
      prisma.category.upsert({
        where: { name: 'Festival Specials' },
        update: {},
        create: {
          name: 'Festival Specials',
          description: 'Special ladoos and sweets for festivals and celebrations',
          isActive: true,
        },
      }),
    ]);

    console.log(`✓ Created ${categories.length} categories`);

    // Create sample products
    const products = await Promise.all([
      prisma.product.upsert({
        where: { id: 'prod_motichur_001' },
        update: {},
        create: {
          id: 'prod_motichur_001',
          categoryId: categories[0].id,
          name: 'Motichur Ladoo',
          description: 'Delicious motichur ladoo made with ghee and dried milk solids',
          price: new Prisma.Decimal('250.00'),
          unit: 'PIECE',
          stockQuantity: 50,
          lowStockThreshold: 10,
          isActive: true,
          images: ['https://via.placeholder.com/400x400?text=Motichur+Ladoo'],
        },
      }),
      prisma.product.upsert({
        where: { id: 'prod_besan_001' },
        update: {},
        create: {
          id: 'prod_besan_001',
          categoryId: categories[0].id,
          name: 'Besan Ladoo',
          description: 'Traditional besan ladoo with a perfect blend of spices',
          price: new Prisma.Decimal('200.00'),
          unit: 'PIECE',
          stockQuantity: 75,
          lowStockThreshold: 15,
          isActive: true,
          isFeatured: true,
          images: ['https://via.placeholder.com/400x400?text=Besan+Ladoo'],
        },
      }),
      prisma.product.upsert({
        where: { id: 'prod_peda_001' },
        update: {},
        create: {
          id: 'prod_peda_001',
          categoryId: categories[2].id,
          name: 'Premium Peda Ladoo',
          description: 'Premium peda ladoo made with finest khoya and ghee',
          price: new Prisma.Decimal('350.00'),
          discountPrice: new Prisma.Decimal('300.00'),
          unit: 'PIECE',
          stockQuantity: 30,
          lowStockThreshold: 8,
          isActive: true,
          isFeatured: true,
          images: ['https://via.placeholder.com/400x400?text=Peda+Ladoo'],
        },
      }),
    ]);

    console.log(`✓ Created ${products.length} products`);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ladoobusiness.com' },
      update: {},
      create: {
        email: 'admin@ladoobusiness.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '+919876543210',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
    });

    console.log(`✓ Created admin user: ${adminUser.email}`);

    // Create sample customer user
    const customerPassword = await bcrypt.hash('customer@123', 10);
    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        password: customerPassword,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+919876543211',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: true,
      },
    });

    console.log(`✓ Created sample customer: ${customerUser.email}`);

    // Create address for customer (idempotent)
    await prisma.address.deleteMany({
      where: { userId: customerUser.id },
    });

    const address = await prisma.address.create({
      data: {
        userId: customerUser.id,
        fullName: 'John Doe',
        phoneNumber: '+919876543211',
        addressLine1: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true,
      },
    });

    console.log(`✓ Created address for customer`);

    // Create cart for customer
    const cart = await prisma.cart.upsert({
      where: { userId: customerUser.id },
      update: {},
      create: {
        userId: customerUser.id,
      },
    });

    console.log(`✓ Created cart for customer`);

    console.log('\n✓ Database seeding completed successfully!');
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
