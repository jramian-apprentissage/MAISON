import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Wallet, Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-center text-2xl">
                Verifiez votre email
              </CardTitle>
              <CardDescription className="text-center">
                Un email de confirmation vous a ete envoye
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Cliquez sur le lien dans votre email pour confirmer votre compte.
                Verifiez aussi votre dossier spam.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
