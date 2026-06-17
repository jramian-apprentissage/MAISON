'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase injects the session from the hash fragment automatically
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('Le mot de passe doit faire au moins 6 caracteres')
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas')

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
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
              <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
              <CardDescription>Choisissez un nouveau mot de passe pour votre compte</CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <p className="text-center text-sm text-success">
                  Mot de passe mis a jour. Redirection...
                </p>
              ) : !ready ? (
                <p className="text-center text-sm text-muted-foreground">
                  Verification du lien en cours...
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
