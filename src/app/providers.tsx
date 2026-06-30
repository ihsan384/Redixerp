import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/AuthContext'
import { queryClient } from '@/lib/queryClient'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            closeButton
            richColors
            toastOptions={{
              style: {
                background: 'rgba(17, 17, 17, .96)',
                border: '1px solid rgba(255,255,255,.1)',
                color: '#ffffff',
                borderRadius: '16px',
                fontFamily: 'Satoshi, Inter, sans-serif',
                boxShadow: '0 24px 64px rgba(0,0,0,.48)',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
