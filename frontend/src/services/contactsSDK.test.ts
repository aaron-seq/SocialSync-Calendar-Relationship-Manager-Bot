import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactsSDK } from './contactsSDK';

// Mock getSupabaseClient
// Helper to create an awaitable mock object
const createAwaitableMock = (implementation: any = {}) => {
  const mockPromise = Promise.resolve({ data: [], error: null });
  // Allow chaining
  const chainable = {
    ...implementation,
    then: (resolve: any, reject: any) => mockPromise.then(resolve, reject),
    // Common chain methods
    select: vi.fn(() => chainable),
    order: vi.fn(() => chainable),
    eq: vi.fn(() => chainable),
    range: vi.fn(() => chainable),
    single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    insert: vi.fn(() => chainable),
    update: vi.fn(() => chainable),
    delete: vi.fn(() => chainable),
  };
  return chainable;
};

const mockQueryChain = createAwaitableMock();

const mockFrom = vi.fn(() => mockQueryChain);

// We'll spy on the specific methods we need to assert on
const mockOrder = mockQueryChain.order;
const mockInsert = mockQueryChain.insert;

vi.mock('./supabase.service', () => ({
  getSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    measure: vi.fn((name, fn) => fn()),
    track: vi.fn(),
    trackError: vi.fn(),
  },
}));

describe('ContactsSDK', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContacts', () => {
    it('should fetch and map contacts successfully', async () => {
      const mockData = [
        {
          id: '123',
          user_id: 'user1',
          full_name: 'John Doe',
          nickname: 'Johnny',
          intimacy_level: 8,
          last_interaction_date: '2023-01-01',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        },
      ];

      // Setup mock return
      // We need to override the 'then' behavior for this specific test
      mockQueryChain.then = vi.fn((resolve: any) => resolve({ data: mockData, error: null })) as any;

      const result = await ContactsSDK.getContacts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].fullName).toBe('John Doe');
      expect(result.data![0].healthScore).toBeDefined();
      expect(mockFrom).toHaveBeenCalledWith('contacts');
    });

    it('should handle errors gracefully', async () => {
      mockQueryChain.then = vi.fn((resolve: any) => resolve({ data: null, error: { message: 'Network error' } })) as any;

      const result = await ContactsSDK.getContacts();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createContact', () => {
    it('should insert and map new contact', async () => {
      const newContact = {
        fullName: 'Jane Doe',
        intimacyLevel: 5,
      };

      const mockDbResponse = {
        id: '456',
        full_name: 'Jane Doe',
        intimacy_level: 5,
        created_at: '2023-01-01',
      };

      mockQueryChain.single.mockResolvedValue({ data: mockDbResponse, error: null });

      const result = await ContactsSDK.createContact(newContact);

      expect(result.success).toBe(true);
      expect(result.data?.fullName).toBe('Jane Doe');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        full_name: 'Jane Doe',
        intimacy_level: 5,
      }));
    });
  });
});
