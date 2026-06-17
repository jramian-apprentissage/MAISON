'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Wallet } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Attention, une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">Trano</span>
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">
                {forgotMode ? 'Mot de passe oublie' : 'Connexion'}
              </CardTitle>
              <CardDescription>
                {forgotMode
                  ? 'Entrez votre email pour recevoir un lien de reinitialisation'
                  : 'Entrez vos identifiants pour acceder a votre compte'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotMode ? (
                resetSent ? (
                  <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm text-success">
                      Email envoye ! Verifiez votre boite mail.
                    </p>
                    <Button variant="outline" onClick={() => { setForgotMode(false); setResetSent(false) }}>
                      Retour a la connexion
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Envoi...' : 'Envoyer le lien'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setForgotMode(false); setError(null) }}
                      className="text-center text-sm text-muted-foreground underline underline-offset-4"
                    >
                      Retour a la connexion
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Mot de passe</Label>
                        <button
                          type="button"
                          onClick={() => { setForgotMode(true); setError(null) }}
                          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                          Mot de passe oublie ?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    {"Pas encore de compte ? "}
                    <Link href="/auth/sign-up" className="text-primary underline underline-offset-4">
                      Creer un compte
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
