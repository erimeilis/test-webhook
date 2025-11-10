# Changelog

All notable changes to the Webhook Admin Panel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-10

### Added
- Server-side pagination for webhook requests table (scalable to 100,500+ records)
- Proper React component architecture - all UI elements now use React components (no raw HTML)
- Pagination component with ghost/soft button styling
- Square pagination buttons with consistent sizing (`w-7 h-7`)
- Proper cursor states (pointer for clickable, not-allowed for disabled)
- Disabled state for active page button in pagination

### Changed
- Table component now uses dedicated Pagination component instead of inline HTML
- Pagination buttons use Button component variants (ghost/soft/disabled)
- Removed 240+ lines of old client-side filtering code
- Pagination now uses URL parameters for server-side state management
- Client-side routing updated to work with React Pagination component

### Fixed
- Pagination buttons now properly disabled with no hover effects when disabled
- Button hover effects no longer appear on disabled buttons
- Active page button in pagination is now disabled and non-clickable
- All buttons now have proper pointer cursor

### Technical
- Replaced client-side DOM manipulation with server-side SQL queries (LIMIT/OFFSET)
- Added comprehensive CSS rules for disabled button states
- Improved button component with proper cursor states
- Enhanced globals.css with `:disabled` pseudo-class selectors and `!important` overrides

### Testing
- ✅ Tested on production environment
- ✅ Type checking passes with zero errors
- ✅ Linting passes with zero warnings
- ✅ All pagination functionality working correctly

### Known Issues
- Token rotation feature still needs to be implemented (planned for future release)

## [0.1.0] - 2025-11-09

### Added
- Initial release
- Google OAuth authentication
- Email/Password authentication with verification
- User dashboard
- Webhook management (create, view, delete)
- Webhook data collection and viewing
- Dark theme with Tailwind CSS v4
- Better Auth integration
- Cloudflare D1 database with Drizzle ORM
- Resend email integration
