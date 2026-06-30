'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface SelectorOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PopupSelectorProps<T extends string> {
  id?: string;
  value?: T;
  onValueChange: (value: T) => void;
  options: SelectorOption<T>[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
}

export function PopupSelector<T extends string>({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select option",
  className = "",
  disabled = false,
  'aria-describedby': ariaDescribedBy,
}: PopupSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
          type="button"
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon && <selectedOption.icon className="h-4 w-4" />}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="start" side="bottom">
        <div className="grid gap-1 p-2">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.value;
            
            return (
              <DropdownMenuItem
                key={option.value}
                className={`w-full p-3 h-auto focus:bg-accent cursor-pointer ${
                  isSelected ? 'bg-accent' : ''
                }`}
                onSelect={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  {Icon && (
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div className="text-left flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground leading-tight">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
