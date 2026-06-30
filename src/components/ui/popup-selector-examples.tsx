'use client';

import { useState } from 'react';
import { PopupSelector, SelectorOption } from './popup-selector';
import { Calendar, CreditCard, User, Settings } from 'lucide-react';

// Example 1: Transaction Type Selector
const transactionTypeOptions: SelectorOption<'income' | 'expense'>[] = [
  {
    value: 'income',
    label: 'Income',
    description: 'Money you receive',
  },
  {
    value: 'expense',
    label: 'Expense',
    description: 'Money you spend',
  },
];

// Example 2: Account Type Selector  
const accountTypeOptions: SelectorOption<'cash' | 'bank' | 'credit' | 'mobile'>[] = [
  {
    value: 'cash',
    label: 'Cash',
    description: 'Physical cash on hand',
  },
  {
    value: 'bank',
    label: 'Bank Account',
    description: 'Checking or savings account',
  },
  {
    value: 'credit',
    label: 'Credit Card',
    description: 'Credit or debit card',
  },
  {
    value: 'mobile',
    label: 'Mobile Payment',
    description: 'Mobile wallet or payment app',
  },
];

// Example 3: Priority Selector
const priorityOptions: SelectorOption<'high' | 'medium' | 'low'>[] = [
  {
    value: 'high',
    label: 'High Priority',
    description: 'Urgent and important',
  },
  {
    value: 'medium',
    label: 'Medium Priority',
    description: 'Important but not urgent',
  },
  {
    value: 'low',
    label: 'Low Priority',
    description: 'Can be done later',
  },
];

// Example usage in a form component
export function ExampleForm() {
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>();
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'credit' | 'mobile'>();
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>();

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">Popup Selector Examples</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Transaction Type</label>
        <PopupSelector
          value={transactionType}
          onValueChange={setTransactionType}
          options={transactionTypeOptions}
          placeholder="Select transaction type"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Account Type</label>
        <PopupSelector
          value={accountType}
          onValueChange={setAccountType}
          options={accountTypeOptions}
          placeholder="Select account type"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <PopupSelector
          value={priority}
          onValueChange={setPriority}
          options={priorityOptions}
          placeholder="Select priority"
        />
      </div>
    </div>
  );
}

// HOW TO USE IN OTHER COMPONENTS:
/*
1. Import the component:
   import { PopupSelector, SelectorOption } from '@/components/ui/popup-selector';

2. Define your options with proper typing:
   const myOptions: SelectorOption<'option1' | 'option2'> = [
     {
       value: 'option1',
       label: 'Option 1',
       description: 'Description for option 1',
       icon: SomeIcon, // Optional
     },
   ];

3. Use in your component:
   <PopupSelector
     value={selectedValue}
     onValueChange={setSelectedValue}
     options={myOptions}
     placeholder="Select an option"
   />

4. Benefits:
   - Consistent popup styling across all forms
   - Type-safe selection
   - Accessible and keyboard navigable
   - Clean, modern UI with icons and descriptions
   - Visual feedback for selected state
*/
