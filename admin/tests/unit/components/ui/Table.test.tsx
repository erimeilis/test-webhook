/**
 * Table Component Tests
 * Unit tests for the data table with sorting, filtering, search, and pagination
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table, type TableColumn } from '@/components/ui/Table'

interface TestData {
  id: number
  name: string
  email: string
  status: string
}

describe('Table', () => {
  const sampleData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
  ]

  const sampleColumns: TableColumn<TestData>[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
  ]

  describe('Rendering', () => {
    it('renders table with data', () => {
      render(<Table data={sampleData} columns={sampleColumns} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('renders all column headers', () => {
      render(<Table data={sampleData} columns={sampleColumns} />)

      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('renders empty message when no data', () => {
      render(<Table data={[]} columns={sampleColumns} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('renders custom empty message', () => {
      render(<Table data={[]} columns={sampleColumns} emptyMessage="Custom empty message" />)

      expect(screen.getByText('Custom empty message')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} className="custom-table" />
      )

      expect(container.querySelector('.custom-table')).toBeInTheDocument()
    })

    it('renders with custom tableId', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} tableId="webhooks" />
      )

      expect(container.querySelector('[data-table-container="webhooks"]')).toBeInTheDocument()
    })
  })

  describe('Search Feature', () => {
    it('renders search input by default', () => {
      render(<Table data={sampleData} columns={sampleColumns} />)

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('hides search when searchable is false', () => {
      render(<Table data={sampleData} columns={sampleColumns} searchable={false} />)

      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })

    it('renders custom search placeholder', () => {
      render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          searchPlaceholder="Search webhooks..."
        />
      )

      expect(screen.getByPlaceholderText('Search webhooks...')).toBeInTheDocument()
    })

    it('search input has correct data attribute', () => {
      render(<Table data={sampleData} columns={sampleColumns} tableId="webhooks" />)

      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toHaveAttribute('data-table-search', 'webhooks')
    })

    it('renders search icon', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const searchIcon = container.querySelector('svg circle')
      expect(searchIcon).toBeInTheDocument()
    })
  })

  describe('Sortable Columns', () => {
    it('marks sortable columns with cursor-pointer', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const sortableHeaders = container.querySelectorAll('[data-sortable="true"]')
      sortableHeaders.forEach(header => {
        expect(header).toHaveClass('cursor-pointer')
      })
    })

    it('renders sort icon for sortable columns', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const sortIcon = container.querySelector('[data-sort-icon="id"]')
      expect(sortIcon).toBeInTheDocument()
    })

    it('does not render sort icon for non-sortable columns', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const sortIcon = container.querySelector('[data-sort-icon="email"]')
      expect(sortIcon).not.toBeInTheDocument()
    })

    it('sortable columns have data-sort-key attribute', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const sortableHeader = container.querySelector('[data-sort-key="id"]')
      expect(sortableHeader).toBeInTheDocument()
    })

    it('non-sortable columns do not have sortable attribute', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const emailHeader = container.querySelector('[data-sort-key="email"]')
      expect(emailHeader).not.toHaveAttribute('data-sortable')
    })
  })

  describe('Column Rendering', () => {
    it('renders cell values as strings', () => {
      render(<Table data={sampleData} columns={sampleColumns} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('uses custom render function when provided', () => {
      const columnsWithRender: TableColumn<TestData>[] = [
        {
          key: 'status',
          label: 'Status',
          render: (value) => (
            <span className={value === 'active' ? 'text-green-500' : 'text-red-500'}>
              {String(value).toUpperCase()}
            </span>
          ),
        },
      ]

      render(<Table data={sampleData} columns={columnsWithRender} />)

      expect(screen.getByText('ACTIVE')).toBeInTheDocument()
      expect(screen.getByText('INACTIVE')).toBeInTheDocument()
    })

    it('applies column width when specified', () => {
      const columnsWithWidth: TableColumn<TestData>[] = [
        { key: 'id', label: 'ID', width: '100px' },
        { key: 'name', label: 'Name' },
      ]

      const { container } = render(<Table data={sampleData} columns={columnsWithWidth} />)

      const idHeader = container.querySelector('[data-sort-key="id"]') as HTMLElement
      expect(idHeader?.style.width).toBe('100px')
    })

    it('applies column className when specified', () => {
      const columnsWithClass: TableColumn<TestData>[] = [
        { key: 'id', label: 'ID', className: 'text-center' },
        { key: 'name', label: 'Name' },
      ]

      const { container } = render(<Table data={sampleData} columns={columnsWithClass} />)

      const idHeader = container.querySelector('[data-sort-key="id"]')
      expect(idHeader).toHaveClass('text-center')
    })

    it('handles null and undefined values', () => {
      const dataWithNulls: TestData[] = [
        { id: 1, name: 'Test', email: '', status: '' },
      ]

      render(<Table data={dataWithNulls} columns={sampleColumns} />)

      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  describe('Row Rendering', () => {
    it('renders correct number of rows', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const rows = container.querySelectorAll('[data-table-row]')
      expect(rows).toHaveLength(3)
    })

    it('rows have hover effect', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const rows = container.querySelectorAll('[data-table-row]')
      rows.forEach(row => {
        expect(row).toHaveClass('hover:bg-muted/30')
      })
    })

    it('rows have data-row-index attribute', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const firstRow = container.querySelector('[data-row-index="0"]')
      const secondRow = container.querySelector('[data-row-index="1"]')

      expect(firstRow).toBeInTheDocument()
      expect(secondRow).toBeInTheDocument()
    })

    it('cells have data-column attribute', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const idCell = container.querySelector('[data-column="id"]')
      const nameCell = container.querySelector('[data-column="name"]')

      expect(idCell).toBeInTheDocument()
      expect(nameCell).toBeInTheDocument()
    })

    it('cells have data-label attribute', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const cells = container.querySelectorAll('[data-label="ID"]')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('cells have data-value attribute', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const cell = container.querySelector('[data-value="John Doe"]')
      expect(cell).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('renders pagination controls', () => {
      render(<Table data={sampleData} columns={sampleColumns} />)

      expect(screen.getByTitle('Previous page')).toBeInTheDocument()
      expect(screen.getByTitle('Next page')).toBeInTheDocument()
    })

    it('renders page size selector', () => {
      render(<Table data={sampleData} columns={sampleColumns} />)

      expect(screen.getByText('Show')).toBeInTheDocument()
      expect(screen.getByText('entries')).toBeInTheDocument()
    })

    it('page size selector has correct options', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const select = container.querySelector('select')
      const options = select?.querySelectorAll('option')

      expect(options).toHaveLength(4)
      expect(options?.[0]).toHaveTextContent('10')
      expect(options?.[1]).toHaveTextContent('25')
      expect(options?.[2]).toHaveTextContent('50')
      expect(options?.[3]).toHaveTextContent('100')
    })

    it('page size selector has data attribute', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} tableId="webhooks" />
      )

      const select = container.querySelector('[data-table-page-size="webhooks"]')
      expect(select).toBeInTheDocument()
    })

    it('uses default page size', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const select = container.querySelector('select') as HTMLSelectElement
      expect(select?.value).toBe('10')
    })

    it('uses custom default page size', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} defaultPageSize={25} />
      )

      const select = container.querySelector('select') as HTMLSelectElement
      expect(select?.value).toBe('25')
    })

    it('calculates total pages correctly', () => {
      const largeData = Array.from({ length: 35 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
      }))

      render(<Table data={largeData} columns={sampleColumns} defaultPageSize={10} />)

      // Should show page 1 and total of 4 pages
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  describe('Filters', () => {
    it('renders custom filters', () => {
      render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          filters={
            <>
              <button>Filter 1</button>
              <button>Filter 2</button>
            </>
          }
        />
      )

      expect(screen.getByText('Filter 1')).toBeInTheDocument()
      expect(screen.getByText('Filter 2')).toBeInTheDocument()
    })

    it('does not render filters section when filters not provided', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      // Only search should be present, not filters container
      const filterContainers = container.querySelectorAll('.flex.flex-wrap.gap-2')
      expect(filterContainers.length).toBe(0)
    })

    it('renders filters with responsive layout', () => {
      const { container } = render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          filters={<button>Filter</button>}
        />
      )

      const filtersContainer = container.querySelector('.justify-center.sm\\:justify-start')
      expect(filtersContainer).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('uses responsive table wrapper', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const table = container.querySelector('.responsiveTable')
      expect(table).toBeInTheDocument()
    })

    it('search has responsive width classes', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const searchWrapper = container.querySelector('.w-full.sm\\:flex-1')
      expect(searchWrapper).toBeInTheDocument()
    })

    it('filters have responsive layout', () => {
      const { container } = render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          filters={<button>Filter</button>}
        />
      )

      const filtersWrapper = container.querySelector('.w-full.sm\\:w-auto')
      expect(filtersWrapper).toBeInTheDocument()
    })
  })

  describe('Data Attributes', () => {
    it('container has data-table-container attribute', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} tableId="webhooks" />
      )

      expect(container.querySelector('[data-table-container="webhooks"]')).toBeInTheDocument()
    })

    it('container has data-total-records attribute', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} totalRecords={100} />
      )

      const tableContainer = container.querySelector('[data-total-records="100"]')
      expect(tableContainer).toBeInTheDocument()
    })

    it('table has data-table attribute', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} tableId="webhooks" />
      )

      expect(container.querySelector('[data-table="webhooks"]')).toBeInTheDocument()
    })

    it('tbody has data-table-body attribute', () => {
      const { container } = render(
        <Table data={sampleData} columns={sampleColumns} tableId="webhooks" />
      )

      expect(container.querySelector('[data-table-body="webhooks"]')).toBeInTheDocument()
    })
  })

  describe('Server-Side Pagination', () => {
    it('uses totalRecords for pagination when provided', () => {
      render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          totalRecords={100}
          defaultPageSize={10}
        />
      )

      // Should show "Showing 1-3 of 100" (3 items displayed, 100 total)
      expect(screen.getByText('100', { exact: false })).toBeInTheDocument()
    })

    it('falls back to data length when totalRecords not provided', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const tableContainer = container.querySelector('[data-total-records="3"]')
      expect(tableContainer).toBeInTheDocument()
    })

    it('calculates start and end index correctly', () => {
      render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          currentPage={2}
          defaultPageSize={10}
          totalRecords={35}
        />
      )

      // Page 2 with page size 10 and 3 items: should show 11-13 of 35
      const infoText = screen.getByText('11', { exact: false })
      expect(infoText).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty message with correct colspan', () => {
      const { container } = render(<Table data={[]} columns={sampleColumns} />)

      const emptyCell = container.querySelector('td[colspan="4"]')
      expect(emptyCell).toBeInTheDocument()
    })

    it('centers empty message', () => {
      const { container } = render(<Table data={[]} columns={sampleColumns} />)

      const emptyCell = container.querySelector('.text-center')
      expect(emptyCell).toHaveTextContent('No data available')
    })

    it('applies muted styling to empty message', () => {
      const { container } = render(<Table data={[]} columns={sampleColumns} />)

      const emptyCell = container.querySelector('.text-muted-foreground')
      expect(emptyCell).toHaveTextContent('No data available')
    })
  })

  describe('Styling', () => {
    it('table has border and rounded corners', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const tableWrapper = container.querySelector('.border.border-border.rounded-lg')
      expect(tableWrapper).toBeInTheDocument()
    })

    it('header has background color', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const thead = container.querySelector('.bg-muted\\/50')
      expect(thead).toBeInTheDocument()
    })

    it('header has border bottom', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const thead = container.querySelector('.border-b')
      expect(thead).toBeInTheDocument()
    })

    it('rows have border bottom except last', () => {
      const { container } = render(<Table data={sampleData} columns={sampleColumns} />)

      const rows = container.querySelectorAll('[data-table-row]')
      rows.forEach(row => {
        expect(row).toHaveClass('border-b', 'last:border-b-0')
      })
    })
  })

  describe('Combined Features', () => {
    it('combines all features correctly', () => {
      render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          searchable={true}
          searchPlaceholder="Search table..."
          emptyMessage="Custom empty"
          className="custom-table"
          tableId="custom-id"
          currentPage={1}
          defaultPageSize={25}
          filters={<button>Custom Filter</button>}
          totalRecords={100}
        />
      )

      // Search
      expect(screen.getByPlaceholderText('Search table...')).toBeInTheDocument()

      // Filters
      expect(screen.getByText('Custom Filter')).toBeInTheDocument()

      // Data
      expect(screen.getByText('John Doe')).toBeInTheDocument()

      // Pagination
      expect(screen.getByTitle('Previous page')).toBeInTheDocument()

      // Page size
      const { container } = render(
        <Table
          data={sampleData}
          columns={sampleColumns}
          defaultPageSize={25}
        />
      )
      const select = container.querySelector('select') as HTMLSelectElement
      expect(select?.value).toBe('25')
    })
  })
})
