import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupPage from '@/app/auth/signup/page'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders signup form', () => {
    render(<SignupPage />)
    
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByText('Risk Appetite')).toBeInTheDocument()
  })

  it('shows password strength indicator', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    
    const passwordInput = screen.getByLabelText('Password')
    await user.type(passwordInput, 'weak')
    
    expect(screen.getByText('Weak')).toBeInTheDocument()
    expect(screen.getByText('Add an uppercase letter')).toBeInTheDocument()
  })

  it('shows strong password indicator', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    
    const passwordInput = screen.getByLabelText('Password')
    await user.type(passwordInput, 'StrongPass123!')
    
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('shows password mismatch error', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'different123')
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })

  it('handles successful signup', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com' },
        ai_feedback: ['Add a number', 'Use a special character']
      })
    })

    render(<SignupPage />)
    
    await user.type(screen.getByLabelText('First Name'), 'John')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: undefined,
            riskAppetite: 'moderate'
          })
        })
      )
    })
  })

  it('handles signup error', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already registered' })
    })

    render(<SignupPage />)
    
    await user.type(screen.getByLabelText('First Name'), 'John')
    await user.type(screen.getByLabelText('Email'), 'existing@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    
    const passwordInput = screen.getByLabelText('Password')
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
