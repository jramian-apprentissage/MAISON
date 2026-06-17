'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createInvitation } from '@/lib/actions/household'
import { updateMemberDisplayName, adminResetMemberPassword } from '@/lib/actions/members'
import { Copy, KeyRound, Check, Pencil, KeySquare, X } from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  user_id: string
  role: string
  display_name: string | null
}

interface Invitation {
  id: string
  code: string
  expires_at: string
}

interface MembersClientProps {
  householdId: string
  householdName: string
  userName: string
  currency: string
  isAdmin: boolean
  members: Member[]
  initialInvitations: Invitation[]
}

export function MembersClient({
  householdId,
  householdName,
  userName,
  currency,
  isAdmin,
  members: initialMembers,
  initialInvitations,
}: MembersClientProps) {
  const [members, setMembers] = useState(initialMembers)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Edit name state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  // Password reset state
  const [resetId, setResetId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isSavingPwd, setIsSavingPwd] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    const result = await createInvitation(householdId)
    if (result.error) {
      toast.error(result.error)
    } else if (result.code) {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      setInvitations((prev) => [{ id: result.code!, code: result.code!, expires_at: expires }, ...prev])
      toast.success('Code genere')
    }
    setIsGenerating(false)
  }

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Code copie')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const startEdit = (m: Member) => {
    setEditingId(m.user_id)
    setEditName(m.display_name || '')
    setResetId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveName = async (userId: string) => {
    if (!editName.trim()) return
    setIsSavingName(true)
    const result = await updateMemberDisplayName(householdId, userId, editName)
    if (result.error) {
      toast.error(result.error)
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, display_name: editName.trim() } : m))
      )
      toast.success('Nom mis a jour')
      setEditingId(null)
    }
    setIsSavingName(false)
  }

  const startReset = (userId: string) => {
    setResetId(userId)
    setNewPassword('')
    setEditingId(null)
  }

  const cancelReset = () => {
    setResetId(null)
    setNewPassword('')
  }

  const savePassword = async (userId: string) => {
    if (!newPassword) return
    setIsSavingPwd(true)
    const result = await adminResetMemberPassword(householdId, userId, newPassword)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Mot de passe reinitialise')
      setResetId(null)
      setNewPassword('')
    }
    setIsSavingPwd(false)
  }

  return (
    <AppShell householdName={householdName} userName={userName} currency={currency}>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-[36px]">Membres du foyer</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Membres ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {members.map((m) => {
              const initials = (m.display_name || '?')
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
              const isEditing = editingId === m.user_id
              const isResetting = resetId === m.user_id

              return (
                <div
                  key={m.user_id}
                  className="flex flex-col gap-2 rounded-[14px] border border-border p-3 transition-colors duration-[250ms] ease-out"
                >
                  {/* Main row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                        {initials}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{m.display_name || 'Membre'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>
                        {m.role === 'admin' ? 'Admin' : 'Membre'}
                      </Badge>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => (isEditing ? cancelEdit() : startEdit(m))}
                            aria-label="Modifier le nom"
                          >
                            {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => (isResetting ? cancelReset() : startReset(m.user_id))}
                            aria-label="Reinitialiser le mot de passe"
                          >
                            {isResetting ? <X className="h-4 w-4" /> : <KeySquare className="h-4 w-4" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline edit name */}
                  {isEditing && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nouveau nom"
                        className="h-9 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && saveName(m.user_id)}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => saveName(m.user_id)}
                        disabled={isSavingName || !editName.trim()}
                      >
                        {isSavingName ? '...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  )}

                  {/* Inline password reset */}
                  {isResetting && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nouveau mot de passe (min. 6 car.)"
                        className="h-9 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && savePassword(m.user_id)}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => savePassword(m.user_id)}
                        disabled={isSavingPwd || newPassword.length < 6}
                        className="bg-success text-success-foreground hover:bg-success/90 shrink-0"
                      >
                        {isSavingPwd ? '...' : 'Reinitialiser'}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inviter quelqu&apos;un</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Generez un code et partagez-le. Il est valable 7 jours et utilisable une seule fois.
              </p>
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-fit gap-1.5">
                <KeyRound className="h-4 w-4" />
                {isGenerating ? 'Generation...' : "Generer un code d'invitation"}
              </Button>

              {invitations.length > 0 && (
                <div className="flex flex-col gap-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-[14px] border border-border p-3"
                    >
                      <div>
                        <div className="font-mono text-lg tracking-widest text-primary">{inv.code}</div>
                        <div className="text-xs text-muted-foreground">
                          Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(inv.code)}
                        aria-label="Copier le code"
                      >
                        {copiedCode === inv.code ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
