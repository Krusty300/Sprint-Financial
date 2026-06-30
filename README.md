Finance Tracker

https://finance-tracker-psi-eight.vercel.app/

A comprehensive, modern personal finance management application built with Next.js 14, TypeScript, and Tailwind CSS. Features advanced transaction management, real-time analytics, and professional export capabilities.

Features

Core Functionality
- Transaction Management: Add, edit, delete, and duplicate transactions with custom dialogs
- Advanced Filtering: Date ranges, categories, types, and search functionality
- Bulk Operations: Select and perform actions on multiple transactions
- Real-time Analytics: Live dashboard with spending trends and insights
- Multi-format Export: JSON, CSV, Excel, and PDF export with custom options

User Experience
- Collapsible Sidebar: Toggle between expanded and icon-only views with real-time stats
- Smart Navigation: Dynamic badges showing transaction counts and alerts
- Quick Actions: Context-aware shortcuts for common tasks
- Keyboard Shortcuts: `Ctrl/Cmd + B` to toggle sidebar
- Responsive Design: Works seamlessly on all screen sizes

Technical Features
- Modern Stack: Next.js 14 App Router, TypeScript, Tailwind CSS
- Component Library: shadcn/ui with Radix UI primitives
- State Management: Custom hooks with localStorage persistence
- Error Handling: Comprehensive error boundaries and user feedback
- Performance: Optimized data fetching and memoized calculations

Quick Start

Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

Installation

```bash
# Clone the repository
git clone https://github.com/Krusty300/finance-tracker.git
cd finance-tracker

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

Development

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Build

```bash
# Build for production
npm run build
# or
yarn build
# or
pnpm build
```

Screenshots

Dashboard
Real-time financial overview with charts and key metrics.

Transactions Page
Advanced transaction management with filtering, sorting, and bulk operations.

Enhanced Features
- Export Dialog: Professional multi-format export with custom options
- Duplicate Dialog: Smart transaction duplication with editing capabilities
- Collapsible Sidebar: Space-efficient navigation with real-time stats

Architecture

Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Main app layout
│   │   ├── dashboard/     # Dashboard page
│   │   ├── transactions/  # Transactions management
│   │   ├── budgets/       # Budget management
│   │   ├── reports/       # Financial reports
│   │   ├── accounts/      # Account management
│   │   └── settings/      # Application settings
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── dashboard/         # Dashboard components
│   ├── dialogs/           # Custom dialogs
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   ├── transactions/      # Transaction components
│   └── ui/                # UI component library
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and types
└── styles/                # Global styles
```

Key Technologies
- Framework: Next.js 14 with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui + Radix UI
- Icons: Lucide React
- Forms: React Hook Form + Zod validation
- Notifications: Sonner
- Charts: Recharts

Features Deep Dive

Transaction Management
- CRUD Operations: Full create, read, update, delete functionality
- Bulk Operations: Select multiple transactions for batch actions
- Advanced Filtering: Date ranges, categories, types, and search
- Sorting: Sort by date, amount, description, category, account
- Duplicate Functionality: Smart duplication with pre-filled forms

Export System
- Multiple Formats: JSON, CSV, Excel (CSV), PDF
- Custom Options: Headers, metadata, file naming
- UTF-8 Support: Proper character encoding for international use
- Bulk Export: Export selected transactions or all data

Sidebar Features
- Collapsible Design: Toggle between expanded (256px) and collapsed (64px)
- Real-time Stats: Live balance, income, and expense calculations
- Dynamic Badges: Transaction counts and system alerts
- Quick Actions: Context-aware shortcuts for common tasks
- Keyboard Shortcuts: `Ctrl/Cmd + B` to toggle
- Persistence: Remembers collapsed state in localStorage

Data Management
- Local Storage: Client-side data persistence
- Type Safety: Full TypeScript coverage
- Data Validation: Zod schemas for data integrity
- Error Handling: Comprehensive error boundaries
- Performance: Optimized queries and memoization

Customization

Adding New Features
1. Create components in `src/components/`
2. Add pages in `src/app/(main)/`
3. Create custom hooks in `src/hooks/`
4. Update types in `src/lib/types.ts`

Styling
- Uses Tailwind CSS with custom configuration
- shadcn/ui components for consistent design
- CSS variables for theming support
- Responsive design utilities

Data Structure
- Transactions: Core financial records
- Categories: Income/expense categorization
- Accounts: Financial accounts and balances
- Budgets: Spending limits and tracking

Usage Examples

Adding Transactions
```typescript
// Automatic form handling with validation
const transaction = {
  description: "Grocery Shopping",
  amount: 125.50,
  type: "expense",
  category: "food",
  date: "2024-01-15",
  account: "checking"
};
```

Exporting Data
```typescript
// Multi-format export with options
const exportOptions = {
  format: "csv",
  includeHeaders: true,
  includeMetadata: true,
  dateRange: "custom",
  startDate: "2024-01-01",
  endDate: "2024-01-31"
};
```

Sidebar Stats
```typescript
// Real-time calculations
const stats = {
  balance: 2450.00,    // Income - Expenses
  income: 5200.00,     // Total income
  expenses: 2750.00,   // Total expenses
  transactionCount: 8, // Current month
  accountAlerts: 1    // Low balance accounts
};
```

Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - Primitive components
- [Lucide](https://lucide.dev/) - Icon library
- [Recharts](https://recharts.org/) - Chart library

---

Built with ❤️ for personal finance management
