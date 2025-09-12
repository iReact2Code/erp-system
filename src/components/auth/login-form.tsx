'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
})

export const LoginForm = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setError(null)

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent/received
        body: JSON.stringify(values),
      })

      const data = await response.json()
      console.log('🔍 Login response:', response.status, data)

      if (!response.ok) {
        console.error('❌ Login failed:', response.status, data.error)
        setError(data.error || 'Login failed')
        return
      }

      if (data.success) {
        // Store token and user info in localStorage
        console.log('🔍 Login response data:', data)
        console.log('🔍 Token to store:', data.token)

        localStorage.setItem('auth-token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        console.log('✅ Login successful, token stored')
        console.log('🔍 Stored token:', localStorage.getItem('auth-token'))

        // Use window.location for full page reload to ensure middleware runs
        window.location.href = '/dashboard'
      } else {
        console.error('❌ Login failed - no success flag')
        setError('Login failed - please try again')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 w-full sm:w-[400px]"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <div className="text-sm text-red-500">{error}</div>}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Button
            variant="link"
            className="h-auto p-0 font-normal"
            onClick={() => router.push('/register')}
          >
            Sign up here
          </Button>
        </div>
      </form>
    </Form>
  )
}
