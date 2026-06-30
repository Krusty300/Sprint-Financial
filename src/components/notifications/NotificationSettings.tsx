'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useNotificationSounds } from '@/hooks/useNotificationSounds';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { useNotificationFilters } from '@/hooks/useNotificationFilters';
import { 
  Settings, 
  Volume2, 
  Bell, 
  Clock, 
  Calendar,
  Filter,
  TestTube,
  Save,
  RotateCcw,
  Trash2,
  Plus
} from 'lucide-react';

export function NotificationSettings() {
  const { 
    settings, 
    updateCategorySettings, 
    updateGlobalSettings, 
    updateQuietHours, 
    updateScheduling,
    shouldPlaySound,
    shouldShowDesktop 
  } = useNotificationSettings();
  
  const { testSound, isSupported: soundSupported } = useNotificationSounds();
  const { generateDailySummary, generateWeeklyReport } = useNotificationScheduler();
  const { quickFilters, applyQuickFilter, saveCurrentFilter } = useNotificationFilters();

  const [activeTab, setActiveTab] = useState('general');
  const [testVolume, setTestVolume] = useState(settings.global.volume);

  const handleTestSound = (category: string) => {
    if (!category || typeof category !== 'string') {
      console.warn('Invalid category for sound test:', category);
      return;
    }
    testSound(category as any, testVolume);
  };

  const handleSaveFilter = () => {
    const filterName = prompt('Enter filter name:');
    if (filterName && filterName.trim()) {
      // Validate filter name
      if (filterName.length > 50) {
        toast.error('Filter name too long (max 50 characters)');
        return;
      }
      if (!/^[a-zA-Z0-9\s-_]+$/.test(filterName)) {
        toast.error('Filter name can only contain letters, numbers, spaces, hyphens, and underscores');
        return;
      }
      saveCurrentFilter(filterName.trim(), 'Custom filter');
      toast.success('Filter saved successfully');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <p className="text-muted-foreground">Configure how and when you receive notifications</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/notifications'}>
          <Bell className="h-4 w-4 mr-2" />
          View Notifications
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sounds">Sounds</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Global notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Turn all notifications on or off</p>
                </div>
                <Checkbox
                  checked={settings.global.enabled}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateGlobalSettings({ enabled: checked === true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                </div>
                <Checkbox
                  checked={settings.global.sound}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateGlobalSettings({ sound: checked === true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show system notifications</p>
                </div>
                <Checkbox
                  checked={settings.global.desktop}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateGlobalSettings({ desktop: checked === true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Persistence</Label>
                  <p className="text-sm text-muted-foreground">Keep notifications after refresh</p>
                </div>
                <Checkbox
                  checked={settings.global.persistence}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateGlobalSettings({ persistence: checked === true })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Volume</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(testVolume * 100)}%</span>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={testVolume}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setTestVolume(value);
                    updateGlobalSettings({ volume: value });
                  }}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Visible Notifications</Label>
                <Select
                  value={settings.global.maxVisible.toString()}
                  onValueChange={(value) => updateGlobalSettings({ maxVisible: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>Limit notifications during specific times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">Suppress notifications during quiet hours</p>
                </div>
                <Checkbox
                  checked={settings.quietHours.enabled}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateQuietHours({ enabled: checked === true })}
                />
              </div>

              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => updateQuietHours({ start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => updateQuietHours({ end: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {settings.quietHours.enabled && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Critical Alerts</Label>
                    <p className="text-sm text-muted-foreground">Still show critical notifications</p>
                  </div>
                  <Checkbox
                    checked={settings.quietHours.allowCritical}
                    onCheckedChange={(checked: boolean | 'indeterminate') => updateQuietHours({ allowCritical: checked === true })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Settings */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Category Preferences
              </CardTitle>
              <CardDescription>Configure settings for each notification type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.categories).map(([category, categorySettings]) => (
                <div key={category} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium capitalize">{category}</h3>
                    <Checkbox
                      checked={categorySettings.enabled}
                      onCheckedChange={(checked: boolean | 'indeterminate') => updateCategorySettings(category as any, { enabled: checked === true })}
                    />
                  </div>

                  {categorySettings.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={categorySettings.priority}
                          onValueChange={(value) => updateCategorySettings(category as any, { priority: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Duration (seconds)</Label>
                        <Select
                          value={categorySettings.duration.toString()}
                          onValueChange={(value) => updateCategorySettings(category as any, { duration: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3000">3s</SelectItem>
                            <SelectItem value="5000">5s</SelectItem>
                            <SelectItem value="8000">8s</SelectItem>
                            <SelectItem value="10000">10s</SelectItem>
                            <SelectItem value="0">Persistent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Sound</Label>
                        <Checkbox
                          checked={categorySettings.sound}
                          onCheckedChange={(checked: boolean | 'indeterminate') => updateCategorySettings(category as any, { sound: checked === true })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Desktop</Label>
                        <Checkbox
                          checked={categorySettings.desktop}
                          onCheckedChange={(checked: boolean | 'indeterminate') => updateCategorySettings(category as any, { desktop: checked === true })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Auto Hide</Label>
                        <Checkbox
                          checked={categorySettings.autoHide}
                          onCheckedChange={(checked: boolean | 'indeterminate') => updateCategorySettings(category as any, { autoHide: checked === true })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sound Settings */}
        <TabsContent value="sounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sound Settings
              </CardTitle>
              <CardDescription>Test and configure notification sounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!soundSupported && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Audio notifications are not supported in your browser. You may need to enable them in your browser settings.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(settings.categories).map((category) => (
                  <div key={category} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <h4 className="font-medium capitalize">{category}</h4>
                      <p className="text-sm text-muted-foreground">
                        {shouldPlaySound(category as any, 'medium') ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestSound(category)}
                      disabled={!soundSupported || !shouldPlaySound(category as any, 'medium')}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling */}
        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Notifications
              </CardTitle>
              <CardDescription>Set up automatic summaries and reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Daily Summary</Label>
                    <p className="text-sm text-muted-foreground">Get a daily financial summary</p>
                  </div>
                  <Checkbox
                    checked={settings.scheduling.dailySummary}
                    onCheckedChange={(checked: boolean | 'indeterminate') => updateScheduling({ dailySummary: checked === true })}
                  />
                </div>

                {settings.scheduling.dailySummary && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={settings.scheduling.summaryTime}
                      onChange={(e) => updateScheduling({ summaryTime: e.target.value })}
                      className="w-32"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateDailySummary}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Weekly Report</Label>
                    <p className="text-sm text-muted-foreground">Get a weekly financial report</p>
                  </div>
                  <Checkbox
                    checked={settings.scheduling.weeklyReport}
                    onCheckedChange={(checked: boolean | 'indeterminate') => updateScheduling({ weeklyReport: checked === true })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Monthly Report</Label>
                    <p className="text-sm text-muted-foreground">Get a monthly financial report</p>
                  </div>
                  <Checkbox
                    checked={settings.scheduling.monthlyReport}
                    onCheckedChange={(checked: boolean | 'indeterminate') => updateScheduling({ monthlyReport: checked === true })}
                  />
                </div>

                {(settings.scheduling.weeklyReport || settings.scheduling.monthlyReport) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateWeeklyReport}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Weekly Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters */}
        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Quick Filters
              </CardTitle>
              <CardDescription>Apply preset filters to your notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickFilters.map((quickFilter, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => applyQuickFilter(quickFilter)}
                    className="justify-start"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {quickFilter.name}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleSaveFilter}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Current Filter
                </Button>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
