import { render, screen } from '@testing-library/react'
import { Navigation } from '@/components/navigation'

// Mock the currency provider
jest.mock('@/components/currency-provider', () => ({
  useCurrency: () => ({
    currentCurrency: { code: 'USD', symbol: '$' },
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
    convertFromINR: (amount: number) => amount * 0.012,
    convertToINR: (amount: number) => amount / 0.012,
  }),
}))

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}))

describe('Navigation Component', () => {
  it('renders navigation items', () => {
    render(<Navigation />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Investments')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('renders Grip Invest logo', () => {
    render(<Navigation />)
    
    expect(screen.getByText('Grip Invest')).toBeInTheDocument()
  })

  it('renders currency selector', () => {
    render(<Navigation />)
    
    expect(screen.getByText('USD')).toBeInTheDocument()
  })
})
