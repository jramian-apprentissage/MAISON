'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Wallet, Home, UserPlus } from 'lucide-react'
import { createHousehold, joinHouseholdByCode } from '@/lib/actions/household'
import { toast } from 'sonner'

type Step = 'choose' | 'create' | 'join'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('choose')
  const [isLoading, setIsLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createHousehold(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Foyer cree avec succes !')
      router.push('/dashboard')
    }
    setIsLoading(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const result = await joinHouseholdByCode(inviteCode)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Vous avez rejoint le foyer "${result.householdName}" !`)
      router.push('/dashboard')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">Trano</span>
          </div>

          {step === 'choose' && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Bienvenue !</CardTitle>
                <CardDescription>
                  Comment souhaitez-vous commencer ?
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="flex h-auto items-center justify-start gap-4 p-4"
                  onClick={() => setStep('create')}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Creer un foyer</div>
                    <div className="text-sm text-muted-foreground">
                      Commencez un nouveau budget familial
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="flex h-auto items-center justify-start gap-4 p-4"
                  onClick={() => setStep('join')}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Rejoindre un foyer</div>
                    <div className="text-sm text-muted-foreground">
                      Utilisez un code d{"'"}invitation
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'create' && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Creer un foyer</CardTitle>
                <CardDescription>
                  Donnez un nom a votre foyer. Les categories par defaut seront
                  creees automatiquement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nom du foyer</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex : Famille Rakoto"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('choose')}
                        disabled={isLoading}
                      >
                        Retour
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Creation...' : 'Creer le foyer'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'join' && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Rejoindre un foyer</CardTitle>
                <CardDescription>
                  Entrez le code d{"'"}invitation que vous avez recu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code">Code d{"'"}invitation</Label>
                      <Input
                        id="code"
                        placeholder="Ex : ABC12345"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        required
                        className="text-center text-lg font-mono tracking-widest"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('choose')}
                        disabled={isLoading}
                      >
                        Retour
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Recherche...' : 'Rejoindre'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
