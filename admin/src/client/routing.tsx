/**
 * Client-side JavaScript
 * Handles interactivity and webhook management
 */

import {
  showCreateWebhookModal,
  showEditWebhookModal,
  showConfirmModal,
  showErrorModal,
  showCodeExamplesModal,
  showShareWebhookModal
} from './modal'

// ========================================
// TABLE STATE (must be declared before init runs)
// ========================================

interface TableState {
  currentPage: number
  pageSize: number
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  searchQuery: string
  allRows: HTMLElement[]
}

const tableStates = new Map<string, TableState>()

// ========================================
// INITIALIZATION
// ========================================

console.log('🚀 Webhook Admin Panel - Client loaded')

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

function init() {
  setupEventListeners()
  initializeTables()
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Delegate all button clicks
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement
    const button = target.closest('[data-action]') as HTMLElement

    if (!button) return

    const action = button.getAttribute('data-action')
    const webhookId = button.getAttribute('data-webhook-id')
    const tag = button.getAttribute('data-tag')

    switch (action) {
      case 'create-webhook':
        await handleCreateWebhook(button)
        break

      case 'edit-webhook':
        await handleEditWebhook(button, webhookId!)
        break

      case 'delete-webhook':
        await handleDeleteWebhook(button, webhookId!)
        break

      case 'sign-out':
        await handleSignOut(button)
        break

      case 'code-examples':
        handleCodeExamples(webhookId!)
        break

      case 'share-webhook':
        await handleShareWebhook(webhookId!)
        break

      case 'copy-webhook-url':
        handleCopyWebhookUrl(button, webhookId!)
        break

      case 'filter-by-tag':
        if (tag) {
          handleFilterByTag(tag)
        }
        break

      case 'toggle-menu':
        handleToggleMenu(webhookId!)
        break

      case 'toggle-user-menu':
        handleToggleUserMenu()
        break
    }
  })

  // Sticky header scroll behavior
  window.addEventListener('scroll', () => {
    const st = window.pageYOffset || document.documentElement.scrollTop
    const header = document.querySelector('[data-header]') as HTMLElement
    const headerContent = document.querySelector('[data-header-content]') as HTMLElement

    if (header && headerContent) {
      if (st > 50) {
        headerContent.classList.add('py-2')
        headerContent.classList.remove('py-3')
      } else {
        headerContent.classList.add('py-3')
        headerContent.classList.remove('py-2')
      }
    }
  }, false)

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    // Close user menu if clicking outside
    if (!target.closest('[data-action="toggle-user-menu"]') && !target.closest('[data-user-menu]')) {
      const userMenu = document.querySelector('[data-user-menu]') as HTMLElement
      if (userMenu && !userMenu.classList.contains('hidden')) {
        userMenu.classList.add('hidden')
      }
    }

    // Close webhook kebab menus if clicking outside
    if (!target.closest('[data-action="toggle-menu"]') && !target.closest('[data-menu]')) {
      document.querySelectorAll('[data-menu]').forEach(menu => {
        if (!menu.classList.contains('hidden')) {
          menu.classList.add('hidden')
        }
      })
    }
  })
}

// ========================================
// ACTION HANDLERS
// ========================================

async function handleCreateWebhook(_button: HTMLElement) {
  const result = await showCreateWebhookModal()
  if (!result) return

  try {
    const response = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: result.name, tags: result.tags })
    })

    if (response.ok) {
      window.location.reload()
    } else {
      const data = await response.json().catch(() => ({ error: 'Failed to create webhook' })) as { error?: string }
      showErrorModal(data.error || 'Failed to create webhook')
    }
  } catch (error) {
    console.error('Error creating webhook:', error)
    showErrorModal('Network error. Please try again.')
  }
}

async function handleEditWebhook(_button: HTMLElement, webhookId: string) {
  const webhookCard = document.querySelector(`[data-webhook-id="${webhookId}"]`) as HTMLElement
  if (!webhookCard) return

  const currentName = webhookCard.dataset.webhookName || ''
  const currentTags = webhookCard.dataset.webhookTags || ''
  const result = await showEditWebhookModal({ name: currentName, tags: currentTags })
  if (!result) return

  try {
    const response = await fetch(`/api/webhooks/${webhookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: result.name, tags: result.tags })
    })

    if (response.ok) {
      window.location.reload()
    } else {
      const data = await response.json().catch(() => ({ error: 'Failed to update webhook' })) as { error?: string }
      showErrorModal(data.error || 'Failed to update webhook')
    }
  } catch (error) {
    console.error('Error updating webhook:', error)
    showErrorModal('Network error. Please try again.')
  }
}

async function handleDeleteWebhook(_button: HTMLElement, webhookId: string) {
  const webhookCard = document.querySelector(`[data-webhook-id="${webhookId}"]`) as HTMLElement
  const webhookName = webhookCard?.dataset.webhookName || 'this webhook'

  const confirmed = await showConfirmModal(
    `Are you sure you want to delete "${webhookName}"? This action cannot be undone.`
  )

  if (!confirmed) return

  try {
    const response = await fetch(`/api/webhooks/${webhookId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      window.location.reload()
    } else {
      const data = await response.json().catch(() => ({ error: 'Failed to delete webhook' })) as { error?: string }
      showErrorModal(data.error || 'Failed to delete webhook')
    }
  } catch (error) {
    console.error('Error deleting webhook:', error)
    showErrorModal('Network error. Please try again.')
  }
}

async function handleSignOut(_button: HTMLElement) {
  try {
    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    if (response.ok) {
      window.location.href = '/login'
    } else {
      const data = await response.json().catch(() => ({ error: 'Failed to sign out' })) as { error?: string }
      showErrorModal(data.error || 'Failed to sign out')
    }
  } catch (error) {
    console.error('Error signing out:', error)
    showErrorModal('Network error. Please try again.')
  }
}

function handleCodeExamples(webhookId: string) {
  const webhookCard = document.querySelector(`[data-webhook-id="${webhookId}"]`)
  if (!webhookCard) return

  const urlElement = webhookCard.querySelector('code')
  const webhookUrl = urlElement?.textContent || ''

  const examples = [
    {
      language: 'cURL',
      code: `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "test", "data": {"key": "value"}}'`
    },
    {
      language: 'JavaScript (Fetch)',
      code: `fetch("${webhookUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ event: "test", data: { key: "value" } })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));`
    },
    {
      language: 'Node.js (Axios)',
      code: `const axios = require('axios');

axios.post("${webhookUrl}", {
  event: "test",
  data: { key: "value" }
})
  .then(response => console.log(response.data))
  .catch(error => console.error("Error:", error));`
    },
    {
      language: 'Python (Requests)',
      code: `import requests

response = requests.post(
    "${webhookUrl}",
    json={"event": "test", "data": {"key": "value"}}
)
print(response.json())`
    },
    {
      language: 'PHP (cURL)',
      code: `<?php
$ch = curl_init("${webhookUrl}");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "event" => "test",
    "data" => ["key" => "value"]
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`
    },
    {
      language: 'Go',
      code: `package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func main() {
    data := map[string]interface{}{
        "event": "test",
        "data": map[string]string{"key": "value"},
    }
    jsonData, _ := json.Marshal(data)

    resp, err := http.Post("${webhookUrl}",
        "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
}`
    },
    {
      language: 'Ruby',
      code: `require 'net/http'
require 'json'

uri = URI("${webhookUrl}")
http = Net::HTTP.new(uri.host, uri.port)
request = Net::HTTP::Post.new(uri.path)
request["Content-Type"] = "application/json"
request.body = { event: "test", data: { key: "value" } }.to_json

response = http.request(request)
puts response.body`
    }
  ]

  showCodeExamplesModal(examples, webhookUrl)
}

async function handleShareWebhook(webhookId: string) {
  const webhookCard = document.querySelector(`[data-webhook-id="${webhookId}"]`) as HTMLElement
  const webhookName = webhookCard?.dataset.webhookName || 'webhook'

  await showShareWebhookModal(webhookId, webhookName)
}

function handleCopyWebhookUrl(button: HTMLElement, webhookId: string) {
  const webhookCard = document.querySelector(`[data-webhook-id="${webhookId}"]`) as HTMLElement
  if (!webhookCard) return

  const codeElement = webhookCard.querySelector('code[data-webhook-url]')
  const webhookUrl = codeElement?.textContent || ''

  navigator.clipboard.writeText(webhookUrl).then(() => {
    // Store original content for reset
    const svgElement = button.querySelector('svg')
    if (!svgElement) return

    const iconSize = svgElement.getAttribute('width') || '14'
    const originalIcon = svgElement.cloneNode(true)
    const textSpan = button.querySelector('span')
    const originalText = textSpan?.textContent || ''

    if (!textSpan) return

    // Replace icon with check icon (IconCheck from Tabler Icons)
    const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    checkIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    checkIcon.setAttribute('width', iconSize)
    checkIcon.setAttribute('height', iconSize)
    checkIcon.setAttribute('viewBox', '0 0 24 24')
    checkIcon.setAttribute('fill', 'none')
    checkIcon.setAttribute('stroke', 'currentColor')
    checkIcon.setAttribute('stroke-width', '2')
    checkIcon.setAttribute('stroke-linecap', 'round')
    checkIcon.setAttribute('stroke-linejoin', 'round')

    const checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    checkPath.setAttribute('d', 'M5 12l5 5l10 -10')
    checkIcon.appendChild(checkPath)

    // Replace the icon
    const currentIcon = button.querySelector('svg')
    if (currentIcon && currentIcon.parentNode) {
      currentIcon.parentNode.replaceChild(checkIcon, currentIcon)
    }

    // Change text to "Copied!"
    textSpan.textContent = 'Copied!'

    // Change button color from secondary to success
    button.className = button.className.replace('btn-secondary', 'btn-success')

    // Reset after 2 seconds
    setTimeout(() => {
      // Restore original icon
      const currentCheckIcon = button.querySelector('svg')
      if (currentCheckIcon && currentCheckIcon.parentNode) {
        currentCheckIcon.parentNode.replaceChild(originalIcon, currentCheckIcon)
      }

      // Restore original text
      textSpan.textContent = originalText

      // Restore original color classes
      button.className = button.className.replace('btn-success', 'btn-secondary')
    }, 2000)
  }).catch(err => {
    console.error('Failed to copy:', err)
  })
}

function getTagColor(tag: string): string {
  const TAG_COLORS = ['default', 'success', 'warning', 'error', 'secondary']
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i)
    hash = hash & hash
  }
  const index = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[index] || 'default'
}

function handleFilterByTag(tag: string) {
  const webhookCards = Array.from(document.querySelectorAll('[data-webhook-id]')) as HTMLElement[]

  webhookCards.forEach((card) => {
    const cardTags = card.dataset.webhookTags || ''
    const tagsArray = cardTags.split(',').map(t => t.trim()).filter(Boolean)

    if (tagsArray.includes(tag)) {
      card.style.display = ''
      card.style.backgroundColor = 'var(--muted)'
    } else {
      card.style.display = 'none'
    }
  })

  // Show clear filter button
  showClearFilterButton(tag)
}

function showClearFilterButton(activeTag: string) {
  // Remove existing clear button if any
  const existing = document.getElementById('clear-filter-btn')
  if (existing) existing.remove()

  const mainContainer = document.getElementById('dashboard-main-grid')
  if (!mainContainer) return

  const tagColor = getTagColor(activeTag)

  // Create container
  const clearBtn = document.createElement('div')
  clearBtn.id = 'clear-filter-btn'
  clearBtn.className = 'bg-background border border-border rounded-lg p-4 flex items-center justify-between'

  // Create left side with icon and tag
  const leftSide = document.createElement('span')
  leftSide.className = 'text-sm flex items-center gap-2'

  // Create filter icon SVG
  const filterSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  filterSvg.setAttribute('width', '16')
  filterSvg.setAttribute('height', '16')
  filterSvg.setAttribute('viewBox', '0 0 24 24')
  filterSvg.setAttribute('fill', 'none')
  filterSvg.setAttribute('stroke', 'currentColor')
  filterSvg.setAttribute('stroke-width', '2')
  filterSvg.setAttribute('stroke-linecap', 'round')
  filterSvg.setAttribute('stroke-linejoin', 'round')
  filterSvg.setAttribute('class', 'text-green-500')

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path1.setAttribute('d', 'M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2')
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path2.setAttribute('d', 'M8.5 2h7')
  const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path3.setAttribute('d', 'M7 16h10')

  filterSvg.appendChild(path1)
  filterSvg.appendChild(path2)
  filterSvg.appendChild(path3)

  leftSide.appendChild(filterSvg)
  leftSide.appendChild(document.createTextNode('Filtering by tag:'))

  // Create tag badge with proper color - matching Badge component exactly
  const tagBadge = document.createElement('strong')
  tagBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium'
  tagBadge.textContent = activeTag

  // Set color based on variant using inline styles - solid colors
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    'default': { bg: '#3b82f6', text: '#ffffff', border: '#3b82f6' },    // blue-500
    'secondary': { bg: '#6b7280', text: '#ffffff', border: '#6b7280' },  // gray-500
    'success': { bg: '#22c55e', text: '#ffffff', border: '#22c55e' },    // green-500
    'warning': { bg: '#eab308', text: '#ffffff', border: '#eab308' },    // yellow-500
    'error': { bg: '#ef4444', text: '#ffffff', border: '#ef4444' }       // red-500
  }

  const colors = colorMap[tagColor] || colorMap['default']!
  tagBadge.style.backgroundColor = colors.bg
  tagBadge.style.color = colors.text
  tagBadge.style.border = `1px solid ${colors.border}`

  leftSide.appendChild(tagBadge)

  // Create close button
  const closeBtn = document.createElement('button')
  closeBtn.className = 'p-1 hover:bg-muted rounded transition-colors'
  closeBtn.title = 'Clear filter'

  // Create close icon SVG
  const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  closeSvg.setAttribute('width', '18')
  closeSvg.setAttribute('height', '18')
  closeSvg.setAttribute('viewBox', '0 0 24 24')
  closeSvg.setAttribute('fill', 'none')
  closeSvg.setAttribute('stroke', 'currentColor')
  closeSvg.setAttribute('stroke-width', '2')
  closeSvg.setAttribute('stroke-linecap', 'round')
  closeSvg.setAttribute('stroke-linejoin', 'round')

  const closePath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  closePath1.setAttribute('d', 'M18 6 6 18')
  const closePath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  closePath2.setAttribute('d', 'm6 6 12 12')

  closeSvg.appendChild(closePath1)
  closeSvg.appendChild(closePath2)
  closeBtn.appendChild(closeSvg)
  closeBtn.onclick = () => {
    clearBtn.remove()
    document.querySelectorAll('[data-webhook-id]').forEach((el: Element) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.display = ''
      htmlEl.style.backgroundColor = ''
    })
  }

  clearBtn.appendChild(leftSide)
  clearBtn.appendChild(closeBtn)
  mainContainer.insertBefore(clearBtn, mainContainer.firstChild)
}

function handleToggleMenu(webhookId: string) {
  const menu = document.querySelector(`[data-menu="${webhookId}"]`) as HTMLElement
  if (!menu) {
    console.warn('Menu not found for webhook:', webhookId)
    return
  }

  // Toggle visibility
  if (menu.classList.contains('hidden')) {
    // Close all other menus first
    document.querySelectorAll('[data-menu]').forEach(m => {
      if (m !== menu) {
        m.classList.add('hidden')
      }
    })
    menu.classList.remove('hidden')
  } else {
    menu.classList.add('hidden')
  }
}

function handleToggleUserMenu() {
  const menu = document.querySelector('[data-user-menu]') as HTMLElement
  if (!menu) return

  // Toggle visibility
  if (menu.classList.contains('hidden')) {
    menu.classList.remove('hidden')
  } else {
    menu.classList.add('hidden')
  }
}

// ========================================
// TABLE FUNCTIONALITY
// ========================================

function initializeTables() {
  // Find all tables
  const tableContainers = document.querySelectorAll('[data-table-container]')

  tableContainers.forEach((container) => {
    const tableId = container.getAttribute('data-table-container')
    if (!tableId) return

    // Get all rows
    const tbody = container.querySelector(`[data-table-body="${tableId}"]`)
    if (!tbody) return

    const allRows = Array.from(tbody.querySelectorAll('[data-table-row]')) as HTMLElement[]

    // Initialize state
    const pageSizeSelect = container.querySelector(`[data-table-page-size="${tableId}"]`)
    const pageSize = pageSizeSelect ? Number((pageSizeSelect as unknown as HTMLSelectElement).value) : 10
    tableStates.set(tableId, {
      currentPage: 1,
      pageSize,
      sortColumn: null,
      sortDirection: 'asc',
      searchQuery: '',
      allRows
    })

    // Setup event listeners
    setupTableEventListeners(tableId, container as HTMLElement)

    // Initial render
    renderTable(tableId)
  })
}

function setupTableEventListeners(tableId: string, container: HTMLElement) {
  // Search input
  const searchInput = container.querySelector(`[data-table-search="${tableId}"]`)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const state = tableStates.get(tableId)
      if (!state) return

      state.searchQuery = (e.target as HTMLInputElement).value.toLowerCase().trim()
      state.currentPage = 1 // Reset to first page on search
      renderTable(tableId)
    })
  }

  // Page size selector
  const pageSizeSelect = container.querySelector(`[data-table-page-size="${tableId}"]`)
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      const state = tableStates.get(tableId)
      if (!state) return

      state.pageSize = Number((e.target as HTMLSelectElement).value)
      state.currentPage = 1 // Reset to first page on page size change
      renderTable(tableId)
    })
  }

  // Sorting headers
  const sortableHeaders = container.querySelectorAll('[data-sortable="true"]')
  sortableHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const sortKey = header.getAttribute('data-sort-key')
      if (!sortKey) return

      const state = tableStates.get(tableId)
      if (!state) return

      if (state.sortColumn === sortKey) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        state.sortColumn = sortKey
        state.sortDirection = 'asc'
      }

      renderTable(tableId)
    })
  })

  // Pagination buttons
  const firstButton = container.querySelector(`[data-table-first="${tableId}"]`)
  const prevButton = container.querySelector(`[data-table-prev="${tableId}"]`)
  const nextButton = container.querySelector(`[data-table-next="${tableId}"]`)
  const lastButton = container.querySelector(`[data-table-last="${tableId}"]`)

  if (firstButton) {
    firstButton.addEventListener('click', () => {
      const state = tableStates.get(tableId)
      if (!state || state.currentPage === 1) return
      state.currentPage = 1
      renderTable(tableId)
    })
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const state = tableStates.get(tableId)
      if (!state || state.currentPage === 1) return
      state.currentPage--
      renderTable(tableId)
    })
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const state = tableStates.get(tableId)
      if (!state) return

      const filteredRows = getFilteredRows(tableId)
      const totalPages = Math.ceil(filteredRows.length / state.pageSize)

      if (state.currentPage < totalPages) {
        state.currentPage++
        renderTable(tableId)
      }
    })
  }

  if (lastButton) {
    lastButton.addEventListener('click', () => {
      const state = tableStates.get(tableId)
      if (!state) return

      const filteredRows = getFilteredRows(tableId)
      const totalPages = Math.ceil(filteredRows.length / state.pageSize)

      if (state.currentPage !== totalPages) {
        state.currentPage = totalPages
        renderTable(tableId)
      }
    })
  }
}

function getFilteredRows(tableId: string): HTMLElement[] {
  const state = tableStates.get(tableId)
  if (!state) return []

  let filtered = state.allRows

  // Apply search filter
  if (state.searchQuery.trim()) {
    filtered = filtered.filter((row) => {
      const cells = row.querySelectorAll('[data-value]')
      return Array.from(cells).some((cell) => {
        const value = cell.getAttribute('data-value') || ''
        return value.toLowerCase().includes(state.searchQuery)
      })
    })
  }

  // Apply sorting
  if (state.sortColumn) {
    filtered = [...filtered].sort((a, b) => {
      const aCell = a.querySelector(`[data-column="${state.sortColumn}"]`)
      const bCell = b.querySelector(`[data-column="${state.sortColumn}"]`)

      const aValue = aCell?.getAttribute('data-value') || ''
      const bValue = bCell?.getAttribute('data-value') || ''

      // Try numeric comparison first
      const aNum = Number(aValue)
      const bNum = Number(bValue)

      let comparison = 0
      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum
      } else {
        comparison = aValue.localeCompare(bValue)
      }

      return state.sortDirection === 'asc' ? comparison : -comparison
    })
  }

  return filtered
}

function renderTable(tableId: string) {
  const state = tableStates.get(tableId)
  if (!state) return

  const container = document.querySelector(`[data-table-container="${tableId}"]`)
  if (!container) return

  const filtered = getFilteredRows(tableId)
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize))
  const startIndex = (state.currentPage - 1) * state.pageSize
  const endIndex = startIndex + state.pageSize

  // Hide all rows first
  state.allRows.forEach((row) => {
    row.style.display = 'none'
  })

  // Show only the rows for the current page
  filtered.slice(startIndex, endIndex).forEach((row) => {
    row.style.display = ''
  })

  // Update sort icons
  const sortableHeaders = container.querySelectorAll('[data-sortable="true"]')
  sortableHeaders.forEach((header) => {
    const sortKey = header.getAttribute('data-sort-key')
    const icon = header.querySelector(`[data-sort-icon="${sortKey}"]`)

    if (!icon) return

    // Clear existing content
    icon.innerHTML = ''

    // Create sort icon SVG
    const sortSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    sortSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    sortSvg.setAttribute('width', '14')
    sortSvg.setAttribute('height', '14')
    sortSvg.setAttribute('viewBox', '0 0 24 24')
    sortSvg.setAttribute('fill', 'none')
    sortSvg.setAttribute('stroke', 'currentColor')
    sortSvg.setAttribute('stroke-width', '2')
    sortSvg.setAttribute('stroke-linecap', 'round')
    sortSvg.setAttribute('stroke-linejoin', 'round')

    if (state.sortColumn === sortKey) {
      // Show active sort icon
      if (state.sortDirection === 'asc') {
        const sortPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        sortPath.setAttribute('d', 'm18 15-6-6-6 6')
        sortSvg.appendChild(sortPath)
      } else {
        const sortPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        sortPath.setAttribute('d', 'm6 9 6 6 6-6')
        sortSvg.appendChild(sortPath)
      }
    } else {
      // Show inactive sort icon
      sortSvg.setAttribute('class', 'opacity-50')
      const sortPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      sortPath1.setAttribute('d', 'm7 15 5 5 5-5')
      const sortPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      sortPath2.setAttribute('d', 'm7 9 5-5 5 5')
      sortSvg.appendChild(sortPath1)
      sortSvg.appendChild(sortPath2)
    }

    icon.appendChild(sortSvg)
  })

  // Update table info (e.g., "Showing 1 to 10 of 45 entries")
  const tableInfo = container.querySelector(`[data-table-info="${tableId}"]`)
  if (tableInfo) {
    const showing = filtered.slice(startIndex, endIndex).length
    const start = filtered.length > 0 ? startIndex + 1 : 0
    const end = startIndex + showing
    tableInfo.textContent = `Showing ${start} to ${end} of ${filtered.length} entries`
  }

  // Generate page numbers
  const pageNumbersContainer = container.querySelector(`[data-table-page-numbers="${tableId}"]`)
  if (pageNumbersContainer) {
    pageNumbersContainer.innerHTML = ''

    // Generate page number buttons (show max 7 pages)
    const maxVisiblePages = 7
    let startPage = 1
    let endPage = totalPages

    if (totalPages > maxVisiblePages) {
      const halfVisible = Math.floor(maxVisiblePages / 2)
      startPage = Math.max(1, state.currentPage - halfVisible)
      endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }
    }

    // Add ellipsis before if needed
    if (startPage > 1) {
      const ellipsisSpan = document.createElement('span')
      ellipsisSpan.className = 'px-2 py-1.5 text-sm text-muted-foreground'
      ellipsisSpan.textContent = '...'
      pageNumbersContainer.appendChild(ellipsisSpan)
    }

    // Add page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button')
      pageBtn.className = `px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors ${
        i === state.currentPage ? 'bg-primary text-primary-foreground hover:bg-primary' : ''
      }`
      pageBtn.textContent = String(i)
      pageBtn.onclick = () => {
        state.currentPage = i
        renderTable(tableId)
      }
      pageNumbersContainer.appendChild(pageBtn)
    }

    // Add ellipsis after if needed
    if (endPage < totalPages) {
      const ellipsisSpan = document.createElement('span')
      ellipsisSpan.className = 'px-2 py-1.5 text-sm text-muted-foreground'
      ellipsisSpan.textContent = '...'
      pageNumbersContainer.appendChild(ellipsisSpan)
    }
  }

  // Update button states
  const firstButton = container.querySelector(`[data-table-first="${tableId}"]`) as HTMLButtonElement
  const prevButton = container.querySelector(`[data-table-prev="${tableId}"]`) as HTMLButtonElement
  const nextButton = container.querySelector(`[data-table-next="${tableId}"]`) as HTMLButtonElement
  const lastButton = container.querySelector(`[data-table-last="${tableId}"]`) as HTMLButtonElement

  if (firstButton) {
    firstButton.disabled = state.currentPage === 1
  }

  if (prevButton) {
    prevButton.disabled = state.currentPage === 1
  }

  if (nextButton) {
    nextButton.disabled = state.currentPage >= totalPages
  }

  if (lastButton) {
    lastButton.disabled = state.currentPage >= totalPages
  }
}
