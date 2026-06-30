'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Sun, 
  Moon, 
  Palette,
  Check,
  Settings as SettingsIcon,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { settingsErrorValidator, ValidationError } from '@/utils/settingsErrorValidation';
import { toast } from 'sonner';
import { useRealtimeSync, syncTheme } from '@/utils/realtimeSync';

interface ThemeOption {
  value: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  preview: {
    background: string;
    card: string;
    text: string;
    border: string;
  };
}

const accentColors = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [selectedAccent, setSelectedAccent] = useState('blue');
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark' | 'unknown'>('unknown');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const [validationInfo, setValidationInfo] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Listen for real-time theme changes from other tabs
  useRealtimeSync('theme-changed', (event) => {
    const { theme: newTheme } = event.data;
    if (newTheme && newTheme !== theme) {
      setTheme(newTheme as any);
      toast.info('Theme updated from another tab');
    }
  });

  // Detect system preference
  useEffect(() => {
    const detectSystemPreference = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setSystemPreference('dark');
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setSystemPreference('light');
      } else {
        setSystemPreference('unknown');
      }
    };

    detectSystemPreference();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => detectSystemPreference();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      name: 'Light',
      icon: <Sun className="h-4 w-4" />,
      description: 'Clean and bright interface for daytime use',
      preview: {
        background: 'bg-white',
        card: 'bg-gray-50',
        text: 'text-gray-900',
        border: 'border-gray-200'
      }
    },
    {
      value: 'dark',
      name: 'Dark',
      icon: <Moon className="h-4 w-4" />,
      description: 'Easy on the eyes for nighttime use',
      preview: {
        background: 'bg-gray-900',
        card: 'bg-gray-800',
        text: 'text-gray-100',
        border: 'border-gray-700'
      }
    },
    {
      value: 'system',
      name: 'System',
      icon: <Monitor className="h-4 w-4" />,
      description: 'Automatically match your device settings',
      preview: {
        background: 'bg-gradient-to-br from-white to-gray-900',
        card: 'bg-gray-100/80',
        text: 'text-gray-800',
        border: 'border-gray-300'
      }
    }
  ];

  const handleThemeChange = async (newTheme: string) => {
    setIsValidating(true);
    
    try {
      // Validate theme change
      const validation = settingsErrorValidator.validateThemeChange(newTheme);
      
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      setValidationInfo(validation.info);

      if (!validation.isValid) {
        // Log errors
        validation.errors.forEach(error => {
          settingsErrorValidator.logError('theme', error, { attemptedTheme: newTheme });
        });
        
        // Show error toast
        toast.error('Theme validation failed', {
          description: validation.errors[0]?.message || 'Invalid theme selection'
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning.message);
          settingsErrorValidator.logError('theme', warning, { attemptedTheme: newTheme });
        });
      }

      // Show info if any
      if (validation.info.length > 0) {
        validation.info.forEach(info => {
          toast.info(info.message);
        });
      }

      // Proceed with theme change if valid
      if (!['light', 'dark', 'system'].includes(newTheme)) {
        const error: ValidationError = {
          field: 'theme',
          message: `Invalid theme value: ${newTheme}`,
          severity: 'error',
          code: 'INVALID_THEME_VALUE'
        };
        settingsErrorValidator.logError('theme', error, { attemptedTheme: newTheme });
        return;
      }
      
      const themeValue = newTheme as 'light' | 'dark' | 'system';
      setTheme(themeValue);
      
      // Broadcast theme change to other tabs
      syncTheme(themeValue);
      
      toast.success('Theme updated successfully');
      
    } catch (error) {
      const errorObj: ValidationError = {
        field: 'theme',
        message: `Unexpected error changing theme: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'THEME_CHANGE_ERROR'
      };
      
      settingsErrorValidator.logError('theme', errorObj, { attemptedTheme: newTheme });
      toast.error('Failed to change theme');
      
    } finally {
      setIsValidating(false);
    }
  };

  const getSystemPreferenceBadge = () => {
    switch (systemPreference) {
      case 'light':
        return <Badge variant="secondary" className="ml-2"><Sun className="h-3 w-3 mr-1" />Light</Badge>;
      case 'dark':
        return <Badge variant="secondary" className="ml-2"><Moon className="h-3 w-3 mr-1" />Dark</Badge>;
      default:
        return <Badge variant="outline" className="ml-2">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Monitor className="mr-2 h-5 w-5" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Alerts */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validationErrors.map((error, index) => (
                <div key={index}>{error.message}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {validationWarnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validationWarnings.map((warning, index) => (
                <div key={index}>{warning.message}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {validationInfo.length > 0 && (
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {validationInfo.map((info, index) => (
                <div key={index}>{info.message}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}
        {/* Simple Theme Selection */}
        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <Select value={theme} onValueChange={handleThemeChange} disabled={isValidating}>
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>System</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        
        {/* Simple Theme Preview */}
        <div className="p-4 border rounded-lg bg-muted/20">
          <div className="text-center space-y-2">
            <div className="text-sm font-medium">Theme Preview</div>
            <div className={`p-3 rounded border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 
              theme === 'light' ? 'bg-white border-gray-200 text-gray-900' : 
              'bg-gradient-to-br from-white to-gray-900 border-gray-300 text-gray-800'
            }`}>
              <div className="text-xs">Current theme appearance</div>
            </div>
          </div>
        </div>

        {/* Quick Toggle Buttons */}
        <div className="flex gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleThemeChange('light')}
            className="flex-1"
            disabled={isValidating}
          >
            <Sun className="h-4 w-4 mr-1" />
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleThemeChange('dark')}
            className="flex-1"
            disabled={isValidating}
          >
            <Moon className="h-4 w-4 mr-1" />
            Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleThemeChange('system')}
            className="flex-1"
            disabled={isValidating}
          >
            <Monitor className="h-4 w-4 mr-1" />
            System
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
