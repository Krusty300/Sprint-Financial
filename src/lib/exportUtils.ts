import { DashboardStats } from './types';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  sections?: string[];
}

export class ReportExporter {
  static async exportReport(
    stats: DashboardStats, 
    options: ExportOptions
  ): Promise<void> {
    switch (options.format) {
      case 'pdf':
        await this.exportToPDF(stats, options);
        break;
      case 'excel':
        await this.exportToExcel(stats, options);
        break;
      case 'csv':
        await this.exportToCSV(stats, options);
        break;
      case 'json':
        await this.exportToJSON(stats, options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private static async exportToPDF(
    stats: DashboardStats, 
    options: ExportOptions
  ): Promise<void> {
    // Generate HTML content for PDF
    const htmlContent = this.generatePDFHTML(stats, options);
    
    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private static generatePDFHTML(stats: DashboardStats, options: ExportOptions): string {
    // Validate stats data
    if (!stats || typeof stats !== 'object') {
      throw new Error('Invalid stats data provided for export');
    }

    const monthlyIncome = typeof stats.monthlyIncome === 'number' ? stats.monthlyIncome : 0;
    const monthlyExpenses = typeof stats.monthlyExpenses === 'number' ? stats.monthlyExpenses : 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Financial Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .header h1 { color: #2563eb; margin-bottom: 10px; }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .summary-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            text-align: center; 
            border-radius: 8px;
        }
        .summary-card h3 { color: #666; font-size: 14px; margin-bottom: 10px; }
        .summary-card .value { font-size: 24px; font-weight: bold; }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
        }
        .section h2 { 
            color: #2563eb; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .insights-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 20px;
        }
        .insight-card { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
        }
        th { background: #f8fafc; font-weight: bold; }
        .chart-placeholder { 
            background: #f1f5f9; 
            height: 200px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 8px;
            margin: 20px 0;
        }
        @media print {
            body { margin: 20px; }
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
            .insights-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Financial Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        ${options.dateRange ? `<p>Period: ${options.dateRange.start} to ${options.dateRange.end}</p>` : ''}
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>Total Balance</h3>
            <div class="value ${stats.totalBalance >= 0 ? 'positive' : 'negative'}">
                $${stats.totalBalance.toFixed(2)}
            </div>
        </div>
        <div class="summary-card">
            <h3>Monthly Income</h3>
            <div class="value positive">+$${stats.monthlyIncome.toFixed(2)}</div>
        </div>
        <div class="summary-card">
            <h3>Monthly Expenses</h3>
            <div class="value negative">-$${stats.monthlyExpenses.toFixed(2)}</div>
        </div>
        <div class="summary-card">
            <h3>Net Worth</h3>
            <div class="value ${stats.netWorth >= 0 ? 'positive' : 'negative'}">
                $${stats.netWorth.toFixed(2)}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Financial Overview</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Monthly Savings</td>
                <td>$${monthlySavings.toFixed(2)}</td>
                <td class="${monthlySavings >= 0 ? 'positive' : 'negative'}">
                    ${monthlySavings >= 0 ? 'Positive' : 'Negative'}
                </td>
            </tr>
            <tr>
                <td>Savings Rate</td>
                <td>${savingsRate.toFixed(1)}%</td>
                <td class="${savingsRate >= 20 ? 'positive' : savingsRate >= 10 ? '' : 'negative'}">
                    ${savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Improvement'}
                </td>
            </tr>
        </table>
    </div>

    ${options.sections?.includes('categories') ? `
    <div class="section">
        <h2>Category Breakdown</h2>
        <table>
            <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Percentage</th>
            </tr>
            ${stats.categoryBreakdown.map(cat => `
                <tr>
                    <td>${cat.category}</td>
                    <td>$${cat.amount.toFixed(2)}</td>
                    <td>${cat.percentage.toFixed(1)}%</td>
                </tr>
            `).join('')}
        </table>
        ${options.includeCharts ? '<div class="chart-placeholder">Category Chart (Interactive chart would appear here)</div>' : ''}
    </div>
    ` : ''}

    ${options.sections?.includes('trends') ? `
    <div class="section">
        <h2>Monthly Trends</h2>
        <table>
            <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Net</th>
            </tr>
            ${stats.monthlyTrend.map(trend => {
                const net = trend.income - trend.expenses;
                return `
                <tr>
                    <td>${trend.month}</td>
                    <td class="positive">$${trend.income.toFixed(2)}</td>
                    <td class="negative">$${trend.expenses.toFixed(2)}</td>
                    <td class="${net >= 0 ? 'positive' : 'negative'}">$${net.toFixed(2)}</td>
                </tr>
            `;
            }).join('')}
        </table>
        ${options.includeCharts ? '<div class="chart-placeholder">Trend Chart (Interactive chart would appear here)</div>' : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2>Key Insights</h2>
        <div class="insights-grid">
            <div class="insight-card">
                <h4>Spending Pattern</h4>
                <p>${stats.monthlyExpenses > stats.monthlyIncome ? 
                  'Your expenses exceed your income. Consider reducing spending.' :
                  stats.monthlyExpenses > stats.monthlyIncome * 0.8 ?
                    'Your expenses are close to your income. Build an emergency fund.' :
                    'You have a healthy expense ratio. Keep up the good work!'
                }</p>
            </div>
            <div class="insight-card">
                <h4>Savings Rate</h4>
                <p>${savingsRate.toFixed(1)}% of your income is saved. ${
                  savingsRate >= 20 ? 'Excellent! You\'re saving more than recommended.' :
                  savingsRate >= 10 ? 'Good! Try to aim for 20% savings rate.' :
                  'Consider increasing your savings rate for better financial health.'
                }</p>
            </div>
            <div class="insight-card">
                <h4>Financial Health</h4>
                <p>${stats.netWorth >= 0 ? 
                  'Your net worth is positive. Keep building your financial foundation.' :
                  'Focus on reducing debt and building assets.'
                }</p>
            </div>
            <div class="insight-card">
                <h4>Top Expense</h4>
                <p>${stats.categoryBreakdown[0] ? 
                  `${stats.categoryBreakdown[0].category} accounts for ${stats.categoryBreakdown[0].percentage}% of expenses.` :
                  'No expense data available.'
                }</p>
            </div>
        </div>
    </div>

    <div class="section">
        <p><em>This report was generated automatically by the Finance Tracker application.</em></p>
    </div>
</body>
</html>
    `;
  }

  private static async exportToExcel(
    stats: DashboardStats, 
    options: ExportOptions
  ): Promise<void> {
    // Create workbook with multiple sheets
    const workbookData = this.createExcelWorkbook(stats, options);
    
    // Convert to CSV format (simplified Excel export)
    const csvContent = this.convertWorkbookToCSV(workbookData);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private static createExcelWorkbook(stats: DashboardStats, options: ExportOptions) {
    const monthlySavings = stats.monthlyIncome - stats.monthlyExpenses;
    const savingsRate = stats.monthlyIncome > 0 ? (monthlySavings / stats.monthlyIncome) * 100 : 0;
    
    return {
      'Summary': [
        ['Metric', 'Value', 'Notes'],
        ['Total Balance', stats.totalBalance, stats.totalBalance >= 0 ? 'Positive' : 'Negative'],
        ['Monthly Income', stats.monthlyIncome, 'Gross income'],
        ['Monthly Expenses', stats.monthlyExpenses, 'Total expenses'],
        ['Monthly Savings', monthlySavings, monthlySavings >= 0 ? 'Positive savings' : 'Negative savings'],
        ['Savings Rate', `${savingsRate.toFixed(1)}%`, savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs improvement'],
        ['Net Worth', stats.netWorth, stats.netWorth >= 0 ? 'Positive net worth' : 'Negative net worth'],
      ],
      'Categories': [
        ['Category', 'Amount', 'Percentage', 'Type'],
        ...stats.categoryBreakdown.map(cat => [
          cat.category,
          cat.amount,
          `${cat.percentage.toFixed(1)}%`,
          cat.amount > 0 ? 'Expense' : 'Income'
        ])
      ],
      'Monthly Trends': [
        ['Month', 'Income', 'Expenses', 'Net', 'Savings Rate'],
        ...stats.monthlyTrend.map(trend => {
          const net = trend.income - trend.expenses;
          const rate = trend.income > 0 ? (net / trend.income * 100) : 0;
          return [
            trend.month,
            trend.income,
            trend.expenses,
            net,
            `${rate.toFixed(1)}%`
          ];
        })
      ],
      'Insights': [
        ['Area', 'Status', 'Recommendation'],
        ['Spending Pattern', 
          stats.monthlyExpenses > stats.monthlyIncome ? 'Needs Attention' : 'Good',
          stats.monthlyExpenses > stats.monthlyIncome ? 'Reduce expenses' : 'Maintain current spending'
        ],
        ['Savings Rate',
          savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Improvement',
          savingsRate >= 20 ? 'Keep saving' : savingsRate >= 10 ? 'Aim for 20%' : 'Increase savings rate'
        ],
        ['Net Worth',
          stats.netWorth >= 0 ? 'Positive' : 'Negative',
          stats.netWorth >= 0 ? 'Build wealth' : 'Reduce debt'
        ]
      ]
    };
  }

  private static convertWorkbookToCSV(workbookData: Record<string, any[][]>): string {
    const sheets = Object.keys(workbookData);
    let csvContent = '';
    
    sheets.forEach((sheetName, index) => {
      if (index > 0) csvContent += '\n\n'; // Separate sheets with newlines
      csvContent += `=== ${sheetName} ===\n`;
      
      workbookData[sheetName].forEach(row => {
        csvContent += row.map(cell => {
          // Handle different data types
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',') + '\n';
      });
    });
    
    return csvContent;
  }

  private static async exportToCSV(
    stats: DashboardStats, 
    options: ExportOptions
  ): Promise<void> {
    // Similar to Excel but with different formatting
    await this.exportToExcel(stats, options);
  }

  private static async exportToJSON(
    stats: DashboardStats, 
    options: ExportOptions
  ): Promise<void> {
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        dateRange: options.dateRange || null
      },
      summary: {
        totalBalance: stats.totalBalance,
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: stats.monthlyExpenses,
        netWorth: stats.netWorth,
        monthlySavings: stats.monthlyIncome - stats.monthlyExpenses,
        savingsRate: stats.monthlyIncome > 0 ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100) : 0
      },
      categories: stats.categoryBreakdown,
      monthlyTrend: stats.monthlyTrend,
      insights: this.generateInsights(stats)
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financial-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  private static generateInsights(stats: DashboardStats) {
    const monthlySavings = stats.monthlyIncome - stats.monthlyExpenses;
    const savingsRate = stats.monthlyIncome > 0 ? (monthlySavings / stats.monthlyIncome * 100) : 0;
    
    return {
      spendingPattern: {
        status: stats.monthlyExpenses > stats.monthlyIncome ? 'critical' : stats.monthlyExpenses > stats.monthlyIncome * 0.8 ? 'warning' : 'good',
        message: stats.monthlyExpenses > stats.monthlyIncome ? 
          'Your expenses exceed your income. Consider reducing spending or increasing income.' :
          stats.monthlyExpenses > stats.monthlyIncome * 0.8 ?
            'Your expenses are close to your income. Build an emergency fund.' :
            'You have a healthy expense ratio. Keep up the good work!'
      },
      savingsRate: {
        status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : 'needs_improvement',
        rate: savingsRate,
        message: savingsRate >= 20 ? 
          'Excellent! You\'re saving more than the recommended 20%.' :
          savingsRate >= 10 ? 
            'Good! Try to aim for 20% savings rate.' :
            'Consider increasing your savings rate for better financial health.'
      },
      netWorth: {
        status: stats.netWorth >= 0 ? 'positive' : 'negative',
        amount: stats.netWorth,
        message: stats.netWorth >= 0 ?
          'Your net worth is positive. Keep building your financial foundation.' :
          'Focus on reducing debt and building assets.'
      },
      topCategory: stats.categoryBreakdown[0] ? {
        category: stats.categoryBreakdown[0].category,
        percentage: stats.categoryBreakdown[0].percentage,
        message: stats.categoryBreakdown[0].percentage > 30 ?
          'This is a significant portion. Review if there are opportunities to optimize.' :
          'This seems reasonable for your budget.'
      } : null
    };
  }
}
