// Stripe Mock
export const stripeMock = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
};

// Firebase Admin Mock
export const firebaseMock = {
  messaging: jest.fn(() => ({
    send: jest.fn().mockResolvedValue('message-id'),
    sendMulticast: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true, messageId: 'message-id' }],
    }),
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createCustomToken: jest.fn(),
  })),
};

// Cloudinary Mock
export const cloudinaryMock = {
  uploader: {
    upload: jest.fn().mockResolvedValue({
      public_id: 'test-image-id',
      secure_url: 'https://res.cloudinary.com/test/image/upload/test-image-id.jpg',
      width: 800,
      height: 600,
    }),
    destroy: jest.fn().mockResolvedValue({
      result: 'ok',
    }),
  },
  api: {
    delete_resources: jest.fn().mockResolvedValue({
      deleted: { 'test-image-id': 'deleted' },
    }),
  },
};

// Reset all mocks
export const resetExternalServiceMocks = () => {
  stripeMock.paymentIntents.create.mockClear();
  stripeMock.paymentIntents.retrieve.mockClear();
  stripeMock.paymentIntents.confirm.mockClear();
  stripeMock.paymentIntents.cancel.mockClear();
  stripeMock.webhooks.constructEvent.mockClear();
  stripeMock.customers.create.mockClear();
  stripeMock.customers.retrieve.mockClear();

  cloudinaryMock.uploader.upload.mockClear();
  cloudinaryMock.uploader.destroy.mockClear();
  cloudinaryMock.api.delete_resources.mockClear();
};
