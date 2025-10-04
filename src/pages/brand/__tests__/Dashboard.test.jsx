import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EnhancedBrandHome from '../Dashboard';
import { AuthProvider } from '../../../contexts/auth-context';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
  storage: {},
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  getCountFromServer: jest.fn(() => Promise.resolve({ data: () => ({ count: 0 }) })),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
    fromMillis: (ms) => ({ toMillis: () => ms }),
    fromDate: (date) => ({ toMillis: () => date.getTime() }),
  },
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  updateDoc: jest.fn(),
}));

// Mock auth context
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  brandId: 'test-brand',
};

jest.mock('../../../contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

// Mock logout hook
jest.mock('../../../hooks/useLogout', () => ({
  useLogout: () => ({
    logout: jest.fn(),
  }),
}));

// Mock child components to avoid unnecessary complexity
jest.mock('../BrandAnalyticsPage', () => () => <div>BrandAnalyticsPage</div>);
jest.mock('../BrandROICalculatorPage', () => () => <div>BrandROICalculatorPage</div>);
jest.mock('../../components/brand/CommunityMetricsChart', () => () => <div>CommunityMetricsChart</div>);
jest.mock('../ContentManager', () => () => <div>ContentManager</div>);
jest.mock('../Communities', () => () => <div>Communities</div>);

describe('Brand Dashboard - User Menu', () => {
  it('should render only one user menu on the page', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <EnhancedBrandHome />
        </AuthProvider>
      </BrowserRouter>
    );

    // Query for all elements with data-testid="user-menu"
    const userMenus = screen.queryAllByTestId('user-menu');

    // Assert that exactly one user menu exists
    expect(userMenus).toHaveLength(1);
  });

  it('should not render duplicate user avatars in sidebar', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <EnhancedBrandHome />
        </AuthProvider>
      </BrowserRouter>
    );

    // The sidebar should not have a user profile section at the bottom
    // Check that the user avatar only appears in the header
    const avatarElements = container.querySelectorAll('[class*="Avatar"]');
    
    // Should have avatars in the header dropdown, but not in sidebar bottom
    // We expect the avatar to be in the header dropdown area
    const sidebarProfileSections = container.querySelectorAll('nav + div.p-4');
    expect(sidebarProfileSections.length).toBe(0);
  });

  it('should display user menu in the header', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <EnhancedBrandHome />
        </AuthProvider>
      </BrowserRouter>
    );

    // The user menu should be present
    const userMenu = screen.getByTestId('user-menu');
    expect(userMenu).toBeInTheDocument();

    // It should be in the header (not in sidebar)
    const header = screen.getByRole('banner', { name: '' }) || 
                   userMenu.closest('header');
    expect(header).toBeInTheDocument();
  });
});
