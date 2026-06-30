'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateFinancialHealthScore, getScoreColor, getScoreBackgroundColor, FinancialHealthScore } from '@/utils/financialHealthScore';
import { DashboardStats } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';

interface FinancialHealthScoreCardProps {
  stats: DashboardStats;
}

export function FinancialHealthScoreCard({ stats }: FinancialHealthScoreCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const healthScore = calculateFinancialHealthScore(stats);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl">
            Financial Health Score
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${getScoreBackgroundColor(healthScore.score)} ${getScoreColor(healthScore.score)} text-xs sm:text-sm`}
          >
            Grade: {healthScore.grade}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Score Display */}
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className={`text-4xl sm:text-5xl font-bold ${getScoreColor(healthScore.score)}`}>
                {healthScore.score}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">out of 100</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={healthScore.score} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="hidden sm:inline">Poor</span>
              <span className="sm:hidden">0</span>
              <span className="hidden sm:inline">Excellent</span>
              <span className="sm:hidden">100</span>
            </div>
          </div>

          {/* Quick Recommendation */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            {healthScore.score >= 75 ? (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-xs sm:text-sm">{healthScore.recommendations[0]}</p>
          </div>

          {/* Expandable Details */}
          {showDetails && (
            <div className="space-y-3 pt-3 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Score Breakdown
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">Savings Rate</span>
                  <span className="text-xs sm:text-sm font-medium">{healthScore.components.savingsRate}%</span>
                </div>
                <Progress value={healthScore.components.savingsRate} className="h-1" />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">Debt Ratio</span>
                  <span className="text-xs sm:text-sm font-medium">{healthScore.components.debtRatio}%</span>
                </div>
                <Progress value={100 - healthScore.components.debtRatio} className="h-1" />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">Spending Control</span>
                  <span className="text-xs sm:text-sm font-medium">{healthScore.components.spendingControl}%</span>
                </div>
                <Progress value={healthScore.components.spendingControl} className="h-1" />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">Emergency Fund</span>
                  <span className="text-xs sm:text-sm font-medium">{healthScore.components.emergencyFund}%</span>
                </div>
                <Progress value={healthScore.components.emergencyFund} className="h-1" />
              </div>

              {healthScore.recommendations.length > 1 && (
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {healthScore.recommendations.slice(1).map((rec, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Toggle Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-xs sm:text-sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
