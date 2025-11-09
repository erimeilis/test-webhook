/**
 * Modal utilities using React components
 * Centralized modal system with Button components via ReactDOM
 */

import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TagsInput } from '@/components/ui/TagsInput'
import type { Webhook, CodeExample, Collaborator, EditWebhookFormData } from '@/types/webhooks'
import { IconX, IconCopy, IconCheck } from '@tabler/icons-react'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import php from 'highlight.js/lib/languages/php'
import go from 'highlight.js/lib/languages/go'
import ruby from 'highlight.js/lib/languages/ruby'
import bash from 'highlight.js/lib/languages/bash'

// Register languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('php', php)
hljs.registerLanguage('go', go)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('bash', bash)

// Modal container component
function ModalContainer({
  children,
  maxWidth = 'max-w-md',
  onClose
}: {
  children: React.ReactNode
  maxWidth?: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className={`bg-card rounded-lg shadow-xl ${maxWidth} w-full mx-4 border border-border`}>
        {children}
      </div>
    </div>
  )
}

// Modal header component
function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <Button
        onClick={onClose}
        color="secondary"
        style="ghost"
        size="sm"
        modifier="square"
        aria-label="Close modal"
        prefixIcon={IconX}
      />
    </div>
  )
}

// Base modal render function
function renderModal(component: React.ReactElement): { root: Root; container: HTMLElement; cleanup: () => void } {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  const cleanup = () => {
    root.unmount()
    container.remove()
    document.removeEventListener('keydown', handleEscape)
  }

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cleanup()
    }
  }
  document.addEventListener('keydown', handleEscape)

  root.render(component)

  return { root, container, cleanup }
}

// Create webhook modal
export function showCreateWebhookModal(): Promise<{ name: string; tags: string } | null> {
  return new Promise((resolve) => {
    function CreateWebhookModal() {
      const [name, setName] = React.useState('')
      const [tags, setTags] = React.useState<string[]>([])

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedName = name.trim()
        if (trimmedName) {
          cleanup()
          resolve({ name: trimmedName, tags: tags.join(', ') })
        }
      }

      const handleCancel = () => {
        cleanup()
        resolve(null)
      }

      return (
        <ModalContainer onClose={handleCancel}>
          <ModalHeader title="Create New Webhook" onClose={handleCancel} />
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="webhook-name" className="block text-sm font-medium mb-2">
                  Webhook Name *
                </label>
                <Input
                  type="text"
                  id="webhook-name"
                  required
                  autoFocus
                  placeholder="e.g., GitHub Push Events"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="webhook-tags" className="block text-sm font-medium mb-2">
                  Tags (optional)
                </label>
                <TagsInput
                  id="webhook-tags"
                  value={tags}
                  onChange={setTags}
                  placeholder="Type and press Enter to add tags..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Press Enter, comma, or paste comma-separated values to add tags
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" color="secondary" style="soft" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Create Webhook
                </Button>
              </div>
            </form>
          </div>
        </ModalContainer>
      )
    }

    const { cleanup } = renderModal(<CreateWebhookModal />)
  })
}

// Confirm modal
export function showConfirmModal(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    function ConfirmModal() {
      const handleConfirm = () => {
        cleanup()
        resolve(true)
      }

      const handleCancel = () => {
        cleanup()
        resolve(false)
      }

      return (
        <ModalContainer onClose={handleCancel}>
          <ModalHeader title="Confirm Action" onClose={handleCancel} />
          <div className="p-6">
            <p className="text-muted-foreground mb-6">{message}</p>

            <div className="flex gap-3 justify-end">
              <Button color="secondary" style="soft" onClick={handleCancel}>
                Cancel
              </Button>
              <Button color="error" onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          </div>
        </ModalContainer>
      )
    }

    const { cleanup } = renderModal(<ConfirmModal />)
  })
}

// Error modal
export function showErrorModal(message: string): void {
  function ErrorModal() {
    const handleClose = () => {
      cleanup()
    }

    return (
      <ModalContainer onClose={handleClose}>
        <ModalHeader title="Error" onClose={handleClose} />
        <div className="p-6">
          <p className="text-destructive mb-6">{message}</p>

          <div className="flex justify-end">
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalContainer>
    )
  }

  const { cleanup } = renderModal(<ErrorModal />)
}

// Success modal
export function showSuccessModal(message: string): void {
  function SuccessModal() {
    const handleClose = () => {
      cleanup()
    }

    return (
      <ModalContainer onClose={handleClose}>
        <ModalHeader title="Success" onClose={handleClose} />
        <div className="p-6">
          <p className="text-green-400 mb-6">{message}</p>

          <div className="flex justify-end">
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalContainer>
    )
  }

  const { cleanup } = renderModal(<SuccessModal />)
}

// Edit webhook modal
export function showEditWebhookModal(webhook: Partial<Webhook>): Promise<EditWebhookFormData | null> {
  return new Promise((resolve) => {
    function EditWebhookModal() {
      const [name, setName] = React.useState(webhook.name ?? '')
      const [tags, setTags] = React.useState<string[]>(
        webhook.tags ? webhook.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      )

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedName = name.trim()

        if (trimmedName) {
          cleanup()
          resolve({ name: trimmedName, tags: tags.join(', ') })
        }
      }

      const handleCancel = () => {
        cleanup()
        resolve(null)
      }

      return (
        <ModalContainer onClose={handleCancel}>
          <ModalHeader title="Edit Webhook" onClose={handleCancel} />
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-webhook-name" className="block text-sm font-medium mb-2">
                  Webhook Name *
                </label>
                <Input
                  type="text"
                  id="edit-webhook-name"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., GitHub Push Events"
                />
              </div>

              <div>
                <label htmlFor="edit-webhook-tags" className="block text-sm font-medium mb-2">
                  Tags
                </label>
                <TagsInput
                  id="edit-webhook-tags"
                  value={tags}
                  onChange={setTags}
                  placeholder="Type and press Enter to add tags..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Press Enter, comma, or paste comma-separated values to add tags
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" color="secondary" style="soft" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </ModalContainer>
      )
    }

    const { cleanup } = renderModal(<EditWebhookModal />)
  })
}

// Code examples modal
export function showCodeExamplesModal(examples: CodeExample[], webhookUrl: string): void {
  function CodeExamplesModal() {
    const [copiedLanguage, setCopiedLanguage] = React.useState<string | null>(null)
    const [urlCopied, setUrlCopied] = React.useState(false)

    const handleCopy = async (language: string, code: string) => {
      await navigator.clipboard.writeText(code)
      setCopiedLanguage(language)
      setTimeout(() => setCopiedLanguage(null), 2000)
    }

    const handleCopyUrl = () => {
      navigator.clipboard.writeText(webhookUrl)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    }

    const handleClose = () => {
      cleanup()
    }

    // Map language to highlight.js language identifier
    const getLanguageId = (language: string): string => {
      if (language.toLowerCase().includes('javascript') || language.toLowerCase().includes('node.js')) return 'javascript'
      if (language.toLowerCase().includes('python')) return 'python'
      if (language.toLowerCase().includes('php')) return 'php'
      if (language.toLowerCase().includes('go')) return 'go'
      if (language.toLowerCase().includes('ruby')) return 'ruby'
      if (language.toLowerCase().includes('curl')) return 'bash'
      return 'plaintext'
    }

    // Get language color
    const getLanguageColor = (language: string): string => {
      if (language.toLowerCase().includes('javascript') || language.toLowerCase().includes('node')) return 'text-yellow-400'
      if (language.toLowerCase().includes('python')) return 'text-blue-400'
      if (language.toLowerCase().includes('php')) return 'text-purple-400'
      if (language.toLowerCase().includes('go')) return 'text-cyan-400'
      if (language.toLowerCase().includes('ruby')) return 'text-red-400'
      if (language.toLowerCase().includes('curl')) return 'text-green-400'
      return 'text-foreground'
    }

    // Highlight code using highlight.js
    const highlightCode = (code: string, language: string) => {
      const langId = getLanguageId(language)
      try {
        return hljs.highlight(code, { language: langId }).value
      } catch {
        return code
      }
    }

    return (
      <ModalContainer maxWidth="max-w-4xl" onClose={handleClose}>
        <ModalHeader title="Code Examples" onClose={handleClose} />
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Webhook URL:</div>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono flex-1 bg-background px-3 py-2 rounded">{webhookUrl}</code>
              <Button
                onClick={handleCopyUrl}
                color={urlCopied ? 'success' : 'secondary'}
                style="ghost"
                size="sm"
                title={urlCopied ? 'Copied!' : 'Copy URL'}
                prefixIcon={urlCopied ? IconCheck : IconCopy}
              >
                {urlCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {examples.map((ex) => (
              <div key={ex.language} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
                  <h3 className={`text-sm font-semibold ${getLanguageColor(ex.language)}`}>{ex.language}</h3>
                  <Button
                    onClick={() => handleCopy(ex.language, ex.code)}
                    color={copiedLanguage === ex.language ? 'success' : 'secondary'}
                    style="ghost"
                    size="sm"
                    title={copiedLanguage === ex.language ? 'Copied!' : 'Copy code'}
                    prefixIcon={copiedLanguage === ex.language ? IconCheck : IconCopy}
                  >
                    {copiedLanguage === ex.language ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-background p-4 overflow-x-auto text-xs leading-relaxed hljs">
                  <code className="font-mono" dangerouslySetInnerHTML={{ __html: highlightCode(ex.code, ex.language) }} />
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button color="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </ModalContainer>
    )
  }

  const { cleanup } = renderModal(<CodeExamplesModal />)
}

// Share webhook modal
export function showShareWebhookModal(webhookId: string, webhookName: string): Promise<void> {
  return new Promise(async (resolve) => {
    const initialCollaborators = await fetchCollaborators(webhookId)

    function ShareWebhookModal() {
      const [email, setEmail] = React.useState('')
      const [collaborators, setCollaborators] = React.useState<Collaborator[]>(initialCollaborators)

      const refreshCollaborators = async () => {
        const newCollaborators = await fetchCollaborators(webhookId)
        setCollaborators(newCollaborators)
      }

      const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedEmail = email.trim()
        if (!trimmedEmail) return

        try {
          const response = await fetch(`/api/webhooks/${webhookId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmedEmail, role: 'collaborator' })
          })

          if (!response.ok) {
            const data = await response.json() as { error?: string }
            await showErrorModal(data.error ?? 'Failed to share webhook')
            return
          }

          setEmail('')
          await refreshCollaborators()
        } catch (error) {
          console.error('Error sharing webhook:', error)
          await showErrorModal('Failed to share webhook')
        }
      }

      const handleRemove = async (shareId: string, email: string) => {
        const confirmed = await showConfirmModal(`Remove ${email} from this webhook?`)
        if (!confirmed) return

        try {
          const response = await fetch(`/api/webhooks/${webhookId}/shares/${shareId}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            await showErrorModal('Failed to remove collaborator')
            return
          }

          await refreshCollaborators()
        } catch (error) {
          console.error('Error removing collaborator:', error)
          await showErrorModal('Failed to remove collaborator')
        }
      }

      const handleClose = () => {
        cleanup()
        resolve()
      }

      return (
        <ModalContainer maxWidth="max-w-2xl" onClose={handleClose}>
          <ModalHeader title={`Share: ${webhookName}`} onClose={handleClose} />
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Invite Collaborator</h3>
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" color="primary">
                  Invite
                </Button>
              </form>
            </div>

            {/* Accepted Collaborators */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Active Collaborators</h3>
              <div className="space-y-2">
                {collaborators.filter(c => c.acceptedAt).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active collaborators</div>
                ) : (
                  collaborators.filter(c => c.acceptedAt).map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                      <div>
                        <div className="text-sm font-medium">{collab.sharedWithEmail}</div>
                        <div className="text-xs text-muted-foreground capitalize">{collab.role}</div>
                      </div>
                      <Button
                        color="error"
                        size="xs"
                        onClick={() => handleRemove(collab.id, collab.sharedWithEmail)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Invitations */}
            {collaborators.filter(c => !c.acceptedAt).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">Pending Invitations</h3>
                <div className="space-y-2">
                  {collaborators.filter(c => !c.acceptedAt).map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded">
                      <div>
                        <div className="text-sm font-medium">{collab.sharedWithEmail}</div>
                        <div className="text-xs text-warning-foreground">Pending invitation</div>
                      </div>
                      <Button
                        color="error"
                        size="xs"
                        onClick={() => handleRemove(collab.id, collab.sharedWithEmail)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button color="secondary" style="soft" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </ModalContainer>
      )
    }

    const { cleanup } = renderModal(<ShareWebhookModal />)
  })
}

async function fetchCollaborators(webhookId: string): Promise<Collaborator[]> {
  try {
    const response = await fetch(`/api/webhooks/${webhookId}/collaborators`)
    if (!response.ok) return []
    const data = await response.json() as { collaborators?: Collaborator[] }
    return data.collaborators ?? []
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return []
  }
}

// Headers modal
export function showHeadersModal(headers: string): void {
  function HeadersModal() {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
      await navigator.clipboard.writeText(headers)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    const handleClose = () => {
      cleanup()
    }

    return (
      <ModalContainer maxWidth="max-w-3xl" onClose={handleClose}>
        <ModalHeader title="Request Headers" onClose={handleClose} />
        <div className="p-6">
          <div className="mb-4">
            <Button
              onClick={handleCopy}
              color={copied ? 'success' : 'secondary'}
              style="ghost"
              size="sm"
              prefixIcon={copied ? IconCheck : IconCopy}
            >
              {copied ? 'Copied!' : 'Copy Headers'}
            </Button>
          </div>
          <pre className="bg-background p-4 rounded border border-border overflow-x-auto max-h-[60vh] overflow-y-auto text-xs font-mono whitespace-pre-wrap break-all">
            {headers}
          </pre>
          <div className="mt-6 flex justify-end">
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalContainer>
    )
  }

  const { cleanup } = renderModal(<HeadersModal />)
}

// Payload modal
export function showPayloadModal(payload: string): void {
  function PayloadModal() {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    const handleClose = () => {
      cleanup()
    }

    // Try to parse and pretty-print JSON
    let displayContent = payload
    let isJson = false
    try {
      const parsed = JSON.parse(payload)
      displayContent = JSON.stringify(parsed, null, 2)
      isJson = true
    } catch {
      // Not JSON, use as-is
    }

    return (
      <ModalContainer maxWidth="max-w-3xl" onClose={handleClose}>
        <ModalHeader title={isJson ? 'Payload (JSON)' : 'Payload'} onClose={handleClose} />
        <div className="p-6">
          <div className="mb-4">
            <Button
              onClick={handleCopy}
              color={copied ? 'success' : 'secondary'}
              style="ghost"
              size="sm"
              prefixIcon={copied ? IconCheck : IconCopy}
            >
              {copied ? 'Copied!' : 'Copy Payload'}
            </Button>
          </div>
          <pre className="bg-background p-4 rounded border border-border overflow-x-auto max-h-[60vh] overflow-y-auto text-xs font-mono whitespace-pre-wrap break-all">
            {displayContent}
          </pre>
          <div className="mt-6 flex justify-end">
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalContainer>
    )
  }

  const { cleanup } = renderModal(<PayloadModal />)
}
