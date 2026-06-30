'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArchiveCleanupConfig, getArchiveCleanupConfig, setArchiveCleanupConfig } from '@/utils/archive-cleanup';
import { Trash2, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ArchiveCleanupSettingsProps {
  onCleanup?: () => Promise<{ deleted: number; failed: number }>;
}

export function ArchiveCleanupSettings({ onCleanup }: ArchiveCleanupSettingsProps) {
  const [config, setConfig] = useState<ArchiveCleanupConfig>(getArchiveCleanupConfig);

  const handleSave = () => {
    setArchiveCleanupConfig(config);
    toast.success('Archive cleanup settings saved');
  };

  const handleRunCleanup = async () => {
    if (onCleanup) {
      const result = await onCleanup();
      toast.success(`Cleaned up ${result.deleted} archived budget(s)${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Archive Cleanup Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-cleanup">Auto-cleanup archived budgets</Label>
            <p className="text-sm text-muted-foreground">
              Automatically delete archived budgets older than the specified time period
            </p>
          </div>
          <Switch
            id="auto-cleanup"
            checked={config.autoCleanup}
            onCheckedChange={(checked) => setConfig({ ...config, autoCleanup: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="months-to-keep">Keep archived budgets for</Label>
          <Select
            value={config.monthsToKeep.toString()}
            onValueChange={(value) => setConfig({ ...config, monthsToKeep: parseInt(value) })}
          >
            <SelectTrigger id="months-to-keep">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 month</SelectItem>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">1 year</SelectItem>
              <SelectItem value="24">2 years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            Save Settings
          </Button>
          {onCleanup && (
            <Button
              variant="outline"
              onClick={handleRunCleanup}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Run Cleanup Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
