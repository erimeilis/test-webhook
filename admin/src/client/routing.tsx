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
  showShareWebhookModal,
  showHeadersModal,
  showPayloadModal
} from './modal'

// ========================================
// TABLE STATE (must be declared before init runs)
// ========================================

// Server-side filtering: no client-side state needed

// URL query parameter helpers
function getTableParams(tableId: string) {
  const params = new URLSearchParams(window.location.search)
  return {
    page: Number(params.get(`${tableId}_page`) || '1'),
    pageSize: Number(params.get(`${tableId}_size`) || '10'),
    sortColumn: params.get(`${tableId}_sort`) || null,
    sortDirection: (params.get(`${tableId}_dir`) || 'asc') as 'asc' | 'desc',
    search: params.get(`${tableId}_search`) || '',
    method: params.get(`${tableId}_method`) || null,
    dateStart: params.get(`${tableId}_date_start`) || null,
    dateEnd: params.get(`${tableId}_date_end`) || null
  }
}

function updateTableParams(tableId: string, updates: Partial<ReturnType<typeof getTableParams>>) {
  const params = new URLSearchParams(window.location.search)
  const current = getTableParams(tableId)
  const merged = { ...current, ...updates }

  // Update or delete parameters
  if (merged.page > 1) params.set(`${tableId}_page`, String(merged.page))
  else params.delete(`${tableId}_page`)

  if (merged.pageSize !== 10) params.set(`${tableId}_size`, String(merged.pageSize))
  else params.delete(`${tableId}_size`)

  if (merged.sortColumn) {
    params.set(`${tableId}_sort`, merged.sortColumn)
    params.set(`${tableId}_dir`, merged.sortDirection)
  } else {
    params.delete(`${tableId}_sort`)
    params.delete(`${tableId}_dir`)
  }

  if (merged.search) params.set(`${tableId}_search`, merged.search)
  else params.delete(`${tableId}_search`)

  if (merged.method) params.set(`${tableId}_method`, merged.method)
  else params.delete(`${tableId}_method`)

  if (merged.dateStart && merged.dateEnd) {
    params.set(`${tableId}_date_start`, merged.dateStart)
    params.set(`${tableId}_date_end`, merged.dateEnd)
  } else {
    params.delete(`${tableId}_date_start`)
    params.delete(`${tableId}_date_end`)
  }

  // Navigate to new URL without page reload (AJAX-based filtering)
  const newUrl = `${window.location.pathname}?${params.toString()}`
  console.log(`🔗 Updating table via AJAX: ${newUrl}`)

  // Update URL without reload using History API
  window.history.pushState({}, '', newUrl)

  // Fetch new table content via AJAX
  fetchTableContent(tableId, newUrl)
}

async function fetchTableContent(tableId: string, url: string) {
  const tableContainer = document.querySelector(`[data-table-container="${tableId}"]`) as HTMLElement
  if (!tableContainer) return

  // Show loading state
  const tableBody = tableContainer.querySelector('[data-table-body]')
  if (tableBody) {
    tableBody.classList.add('opacity-50', 'pointer-events-none')
  }

  try {
    // Fetch the updated page
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Parse the HTML to extract the new table
    // eslint-disable-next-line no-undef
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const newTableContainer = doc.querySelector(`[data-table-container="${tableId}"]`)

    if (newTableContainer && tableContainer) {
      // Replace the entire table container with the new one
      tableContainer.innerHTML = newTableContainer.innerHTML

      // Reinitialize event listeners for the updated table
      setupTableEventListeners(tableId, tableContainer)

      console.log('✅ Table updated successfully')
    }
  } catch (error) {
    console.error('❌ Failed to fetch table content:', error)
    // Fall back to full page reload on error
    window.location.href = url
  } finally {
    // Remove loading state
    if (tableBody) {
      tableBody.classList.remove('opacity-50', 'pointer-events-none')
    }
  }
}

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

  // Apply tag filter if present in URL on page load
  const urlParams = new URLSearchParams(window.location.search)
  const tag = urlParams.get('tag')
  if (tag) {
    applyTagFilter(tag)
  }

  // Restore scroll position after filter reload
  const savedScrollPosition = sessionStorage.getItem('filterScrollPosition')
  if (savedScrollPosition) {
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      window.scrollTo({ top: Number(savedScrollPosition), behavior: 'instant' })
      sessionStorage.removeItem('filterScrollPosition')
    })
  }

  // Browser back/forward will trigger full page reload automatically
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

      case 'toggle-date-range':
        handleToggleDateRange()
        break
    }
  })

  // Headers and Payload modal clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const headersCell = target.closest('[data-headers]') as HTMLElement
    const payloadCell = target.closest('[data-payload]') as HTMLElement

    if (headersCell) {
      const headers = headersCell.getAttribute('data-headers')
      if (headers) {
        showHeadersModal(headers)
      }
      return
    }

    if (payloadCell) {
      const payload = payloadCell.getAttribute('data-payload')
      if (payload) {
        showPayloadModal(payload)
      }
      return
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

    // Close date range dropdown if clicking outside
    if (!target.closest('[data-action="toggle-date-range"]') && !target.closest('[data-filter-dropdown="date-range"]')) {
      const dropdown = document.querySelector('[data-filter-dropdown="date-range"]') as HTMLElement
      if (dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden')
      }
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

function handleFilterByTag(tag: string) {
  // Navigate with full page reload to show server-rendered filter component
  window.location.href = `/dashboard?tag=${encodeURIComponent(tag)}`
}

function applyTagFilter(tag: string) {
  // Select only the webhook card containers (div with data-webhook-tags), not the buttons inside them
  const webhookCards = Array.from(document.querySelectorAll('div[data-webhook-id][data-webhook-tags]')) as HTMLElement[]

  webhookCards.forEach((card) => {
    const cardTags = card.dataset.webhookTags || ''
    const tagsArray = cardTags.split(',').map(t => t.trim()).filter(Boolean)

    if (tagsArray.includes(tag)) {
      card.style.display = ''
    } else {
      card.style.display = 'none'
    }
  })
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

function handleToggleDateRange() {
  const dropdown = document.querySelector('[data-filter-dropdown="date-range"]') as HTMLElement
  if (!dropdown) return

  // Toggle visibility
  if (dropdown.classList.contains('hidden')) {
    dropdown.classList.remove('hidden')
  } else {
    dropdown.classList.add('hidden')
  }
}

// ========================================
// TABLE FUNCTIONALITY
// ========================================

function initializeTables() {
  console.log('🔧 Initializing tables (server-side filtering)...')
  const tableContainers = document.querySelectorAll('[data-table-container]')

  tableContainers.forEach((container) => {
    const tableId = container.getAttribute('data-table-container')
    if (!tableId) return

    // Sync UI with URL parameters
    const params = getTableParams(tableId)

    // Sync page size selector
    const pageSizeSelect = container.querySelector(`[data-table-page-size="${tableId}"]`)
    if (pageSizeSelect instanceof HTMLSelectElement) {
      pageSizeSelect.value = String(params.pageSize)
    }

    // Sync search input
    const searchInput = container.querySelector(`[data-table-search="${tableId}"]`) as HTMLInputElement
    if (searchInput && params.search) {
      searchInput.value = params.search
    }

    // Sync method filter toggle switch
    const toggleSwitch = container.querySelector('[data-toggle-switch="method-filter"]')
    if (toggleSwitch) {
      const activeValue = params.method || 'all'
      const indicator = toggleSwitch.querySelector('[data-toggle-indicator]') as HTMLElement
      const buttons = toggleSwitch.querySelectorAll('[data-toggle-value]')

      buttons.forEach((btn, index) => {
        const value = btn.getAttribute('data-toggle-value')
        if (value === activeValue && indicator) {
          // Move indicator to active button
          indicator.style.transform = `translateX(calc(${index * 100}% + 0.25rem))`
        }
      })
    }

    // Sync date filter
    if (params.dateStart && params.dateEnd) {
      const dateStartInput = container.querySelector('[data-filter-date-start]') as HTMLInputElement
      const dateEndInput = container.querySelector('[data-filter-date-end]') as HTMLInputElement
      const label = container.querySelector('[data-filter-label="date-range"]')

      if (dateStartInput) dateStartInput.value = params.dateStart
      if (dateEndInput) dateEndInput.value = params.dateEnd
      if (label) {
        const start = new Date(params.dateStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const end = new Date(params.dateEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        label.textContent = `${start} - ${end}`
      }
    }

    // Setup event listeners
    setupTableEventListeners(tableId, container as HTMLElement)
  })
}

function setupTableEventListeners(tableId: string, container: HTMLElement) {
  console.log(`🎧 Setting up event listeners for table: ${tableId}`)

  // Search input
  const searchInput = container.querySelector(`[data-table-search="${tableId}"]`)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase().trim()
      updateTableParams(tableId, { search: query, page: 1 })
    })
  }

  // Page size selector
  const pageSizeSelect = container.querySelector(`[data-table-page-size="${tableId}"]`)
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      const pageSize = Number((e.target as HTMLSelectElement).value)
      updateTableParams(tableId, { pageSize, page: 1 })
    })
  }

  // Sorting headers
  const sortableHeaders = container.querySelectorAll('[data-sortable="true"]')
  sortableHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const sortKey = header.getAttribute('data-sort-key')
      if (!sortKey) return

      const params = getTableParams(tableId)
      const newDirection = params.sortColumn === sortKey && params.sortDirection === 'asc' ? 'desc' : 'asc'
      updateTableParams(tableId, { sortColumn: sortKey, sortDirection: newDirection })
    })
  })

  // Pagination buttons
  const prevButton = container.querySelector(`[data-pagination-prev="${tableId}"]`)
  const nextButton = container.querySelector(`[data-pagination-next="${tableId}"]`)
  const pageButtons = container.querySelectorAll('[data-pagination-page]')

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const params = getTableParams(tableId)
      if (params.page > 1) {
        updateTableParams(tableId, { page: params.page - 1 })
      }
    })
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const params = getTableParams(tableId)
      const totalRecords = Number(container.getAttribute('data-total-records') || '0')
      const totalPages = Math.ceil(totalRecords / params.pageSize)
      if (params.page < totalPages) {
        updateTableParams(tableId, { page: params.page + 1 })
      }
    })
  }

  // Page number buttons
  pageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const pageNum = Number(button.getAttribute('data-pagination-page'))
      if (pageNum) {
        updateTableParams(tableId, { page: pageNum })
      }
    })
  })

  // Method filter toggle switch
  const toggleSwitch = container.querySelector('[data-toggle-switch="method-filter"]')
  if (toggleSwitch) {
    const indicator = toggleSwitch.querySelector('[data-toggle-indicator]') as HTMLElement
    const buttons = toggleSwitch.querySelectorAll('[data-toggle-value]')

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const value = button.getAttribute('data-toggle-value')

        // Move indicator to clicked button
        if (indicator) {
          indicator.style.transform = `translateX(calc(${index * 100}% + 0.25rem))`
        }

        // Update URL
        updateTableParams(tableId, { method: value === 'all' ? null : value, page: 1 })
      })
    })
  }

  // Date range filter toggle
  const dateToggle = container.querySelector('[data-filter-toggle="date-range"]')
  const dateDropdown = container.querySelector('[data-filter-dropdown="date-range"]')
  const dateStartInput = container.querySelector('[data-filter-date-start]') as HTMLInputElement
  const dateEndInput = container.querySelector('[data-filter-date-end]') as HTMLInputElement
  const dateClear = container.querySelector('[data-filter-clear="date-range"]')
  const dateApply = container.querySelector('[data-filter-apply="date-range"]')

  if (dateToggle && dateDropdown) {
    dateToggle.addEventListener('click', (e) => {
      e.stopPropagation()
      dateDropdown.classList.toggle('hidden')
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!dateDropdown.contains(target) && !dateToggle.contains(target)) {
        dateDropdown.classList.add('hidden')
      }
    })
  }

  if (dateClear) {
    dateClear.addEventListener('click', () => {
      if (dateStartInput) dateStartInput.value = ''
      if (dateEndInput) dateEndInput.value = ''

      const label = container.querySelector('[data-filter-label="date-range"]')
      if (label) label.textContent = 'All dates'

      if (dateDropdown) dateDropdown.classList.add('hidden')

      // Clear URL parameters
      updateTableParams(tableId, { dateStart: null, dateEnd: null, page: 1 })
    })
  }

  if (dateApply) {
    dateApply.addEventListener('click', () => {
      if (!dateStartInput?.value || !dateEndInput?.value) {
        alert('Please select both start and end dates')
        return
      }

      const label = container.querySelector('[data-filter-label="date-range"]')
      if (label) {
        const start = new Date(dateStartInput.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const end = new Date(dateEndInput.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        label.textContent = `${start} - ${end}`
      }

      if (dateDropdown) dateDropdown.classList.add('hidden')

      // Update URL parameters
      updateTableParams(tableId, {
        dateStart: dateStartInput.value,
        dateEnd: dateEndInput.value,
        page: 1
      })
    })
  }
}

// Server-side filtering: getFilteredRows and renderTable removed (all logic happens on server)
