import { prisma } from '../config/database';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...\n');

    // Test raw query
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✓ Raw query successful:', result);

    // Test creating a test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed_password_here',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: `${Math.floor(Math.random() * 10000000000)}`,
      },
    });
    console.log('✓ User created:', testUser.id);

    // Verify user exists
    const foundUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    console.log('✓ User retrieved:', foundUser?.email);

    // Delete test user
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('✓ Test user deleted');

    console.log('\n✓ All database tests passed!');
  } catch (error) {
    console.error('✗ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
