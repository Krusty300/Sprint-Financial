'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  Calculator, 
  TrendingUp, 
  Percent, 
  Calendar, 
  DollarSign,
  PiggyBank,
  Target,
  ArrowRight,
  Plus,
  Minus,
  X,
  Divide,
  Equal
} from 'lucide-react';

export function FinancialCalculator() {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  
  // Calculator states
  const [activeTab, setActiveTab] = useState('math');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [compoundFrequency, setCompoundFrequency] = useState('12');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  
  // Results
  const [results, setResults] = useState<any>(null);

  // Mathematical operations states
  const [mathDisplay, setMathDisplay] = useState('0');
  const [mathOperation, setMathOperation] = useState('');
  const [mathMemory, setMathMemory] = useState(0);
  const [mathHistory, setMathHistory] = useState<string[]>([]);

  // Compound Interest Calculator
  const calculateCompoundInterest = () => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    const t = parseFloat(time) || 0;
    const n = parseFloat(compoundFrequency) || 12;
    const pm = parseFloat(monthlyContribution) || 0;

    if (p <= 0 || r <= 0 || t <= 0) {
      setResults(null);
      return;
    }

    const monthlyRate = r / 100 / 12;
    const totalMonths = t * 12;
    
    let futureValue = p * Math.pow(1 + r/100/n, n*t);
    
    // Add monthly contributions
    if (pm > 0) {
      futureValue += pm * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    }

    const totalContributions = pm * totalMonths;
    const totalInterest = futureValue - p - totalContributions;

    setResults({
      futureValue,
      totalContributions,
      totalInterest,
      totalInvested: p + totalContributions
    });
  };

  // Loan Calculator
  const [loanAmount, setLoanAmount] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  
  const calculateLoan = () => {
    const principal = parseFloat(loanAmount) || 0;
    const annualRate = parseFloat(loanRate) || 0;
    const years = parseFloat(loanTerm) || 0;

    if (principal <= 0 || annualRate <= 0 || years <= 0) {
      setResults(null);
      return;
    }

    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - principal;

    setResults({
      monthlyPayment,
      totalPayment,
      totalInterest,
      principal
    });
  };

  // Retirement Calculator
  const [currentAge, setCurrentAge] = useState('');
  const [retirementAge, setRetirementAge] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlySavings, setMonthlySavings] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('7');
  
  const calculateRetirement = () => {
    const current = parseFloat(currentAge) || 0;
    const retirement = parseFloat(retirementAge) || 0;
    const savings = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(monthlySavings) || 0;
    const returnRate = parseFloat(expectedReturn) || 7;

    if (current <= 0 || retirement <= current || savings < 0 || monthly < 0) {
      setResults(null);
      return;
    }

    const yearsToRetirement = retirement - current;
    const months = yearsToRetirement * 12;
    const monthlyRate = returnRate / 100 / 12;

    const futureValue = savings * Math.pow(1 + returnRate/100, yearsToRetirement) +
      monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    const totalContributions = monthly * months;
    const totalInterest = futureValue - savings - totalContributions;

    const retirementResults = {
      futureValue,
      totalContributions,
      totalInterest,
      yearsToRetirement,
      monthlyIncome: futureValue * 0.04 / 12 // 4% withdrawal rule
    };
    
    setResults(retirementResults);
  };

  // Mathematical Operations Functions
  const handleMathInput = (value: string) => {
    if (mathDisplay === '0' && value !== '.') {
      setMathDisplay(value);
    } else {
      setMathDisplay(mathDisplay + value);
    }
  };

  const handleMathOperation = (operation: string) => {
    if (mathOperation && mathDisplay !== '0') {
      calculateResult();
    } else {
      // Store current value in memory and clear display for next number
      setMathMemory(parseFloat(mathDisplay) || 0);
      setMathDisplay('0');
    }
    setMathOperation(operation);
  };

  const calculateResult = () => {
    if (!mathOperation || mathDisplay === '0') return;
    
    const current = parseFloat(mathDisplay);
    let result = 0;
    
    switch (mathOperation) {
      case '+':
        result = mathMemory + current;
        break;
      case '-':
        result = mathMemory - current;
        break;
      case '*':
        result = mathMemory * current;
        break;
      case '/':
        result = mathMemory / current;
        break;
      case '%':
        result = mathMemory * (current / 100);
        break;
      default:
        return;
    }
    
    const calculation = `${mathMemory} ${mathOperation} ${mathDisplay} = ${result}`;
    setMathHistory([calculation, ...mathHistory.slice(0, 4)]);
    setMathDisplay(result.toString());
    setMathOperation('');
    setMathMemory(result);
  };

  const handleMathClear = () => {
    setMathDisplay('0');
    setMathOperation('');
    setMathMemory(0);
  };

  const handleClearAll = () => {
    handleMathClear();
    setMathHistory([]);
  };

  const handleMemoryRecall = () => {
    setMathDisplay(mathMemory.toString());
  };

  const handlePercentage = () => {
    const value = parseFloat(mathDisplay) || 0;
    setMathDisplay((value / 100).toString());
  };

  const handleSquareRoot = () => {
    const value = parseFloat(mathDisplay) || 0;
    setMathDisplay(Math.sqrt(value).toString());
  };

  const handleSquare = () => {
    const value = parseFloat(mathDisplay) || 0;
    setMathDisplay((value * value).toString());
  };

  const clearFinancialCalculators = () => {
    setPrincipal('');
    setRate('');
    setTime('');
    setMonthlyContribution('');
    setLoanAmount('');
    setLoanRate('');
    setLoanTerm('');
    setCurrentAge('');
    setRetirementAge('');
    setCurrentSavings('');
    setMonthlySavings('');
    setExpectedReturn('7');
    setResults(null);
    // Also clear math calculator
    handleMathClear();
    setMathHistory([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Financial Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="math">Math Calculator</TabsTrigger>
            <TabsTrigger value="compound">Compound Interest</TabsTrigger>
            <TabsTrigger value="loan">Loan Calculator</TabsTrigger>
            <TabsTrigger value="retirement">Retirement</TabsTrigger>
          </TabsList>

          <TabsContent value="math" className="space-y-4">
            <div className="space-y-4">
              {/* Display */}
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-mono font-bold text-right">
                  {mathDisplay}
                </div>
                {mathOperation && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Operation: {mathOperation}
                  </div>
                )}
              </div>
              
              {/* Number Pad */}
              <div className="grid grid-cols-4 gap-2">
                {/* Row 1 */}
                <Button variant="outline" onClick={() => handleMathClear()} className="col-span-2">
                  Clear
                </Button>
                <Button variant="outline" onClick={handlePercentage}>
                  <Percent className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleSquareRoot}>
                  √
                </Button>
                
                {/* Row 2 */}
                <Button onClick={() => handleMathInput('7')}>7</Button>
                <Button onClick={() => handleMathInput('8')}>8</Button>
                <Button onClick={() => handleMathInput('9')}>9</Button>
                <Button variant="outline" onClick={() => handleMathOperation('/')}>
                  <Divide className="h-4 w-4" />
                </Button>
                
                {/* Row 3 */}
                <Button onClick={() => handleMathInput('4')}>4</Button>
                <Button onClick={() => handleMathInput('5')}>5</Button>
                <Button onClick={() => handleMathInput('6')}>6</Button>
                <Button variant="outline" onClick={() => handleMathOperation('*')}>
                  <X className="h-4 w-4" />
                </Button>
                
                {/* Row 4 */}
                <Button onClick={() => handleMathInput('1')}>1</Button>
                <Button onClick={() => handleMathInput('2')}>2</Button>
                <Button onClick={() => handleMathInput('3')}>3</Button>
                <Button variant="outline" onClick={() => handleMathOperation('-')}>
                  <Minus className="h-4 w-4" />
                </Button>
                
                {/* Row 5 */}
                <Button onClick={() => handleMathInput('0')}>0</Button>
                <Button onClick={() => handleMathInput('.')}>.</Button>
                <Button variant="outline" onClick={calculateResult}>
                  <Equal className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => handleMathOperation('+')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Memory Functions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleMemoryRecall}>
                  MR: {formatCurrency(mathMemory)}
                </Button>
                <Button variant="outline" onClick={handleSquare}>
                  x²
                </Button>
                <Button variant="outline" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
              
              {/* History */}
              {mathHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Recent Calculations</h4>
                  <div className="space-y-1">
                    {mathHistory.map((calc, index) => (
                      <div key={index} className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                        {calc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="compound" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Initial Amount ({getCurrencySymbol(currency)})</Label>
                <Input
                  id="principal"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  placeholder="7.5"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time Period (Years)</Label>
                <Input
                  id="time"
                  type="number"
                  step="1"
                  placeholder="10"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compound">Compound Frequency</Label>
                <Select value={compoundFrequency} onValueChange={setCompoundFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Annually</SelectItem>
                    <SelectItem value="4">Quarterly</SelectItem>
                    <SelectItem value="12">Monthly</SelectItem>
                    <SelectItem value="365">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthly">Monthly Contribution ({getCurrencySymbol(currency)})</Label>
                <Input
                  id="monthly"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={calculateCompoundInterest} className="w-full md:w-auto">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="loan" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan-amount">Loan Amount ({getCurrencySymbol(currency)})</Label>
                <Input
                  id="loan-amount"
                  type="number"
                  step="0.01"
                  placeholder="250000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="loan-rate">Interest Rate (%)</Label>
                <Input
                  id="loan-rate"
                  type="number"
                  step="0.1"
                  placeholder="4.5"
                  value={loanRate}
                  onChange={(e) => setLoanRate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="loan-term">Loan Term (Years)</Label>
                <Input
                  id="loan-term"
                  type="number"
                  step="1"
                  placeholder="30"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={calculateLoan} className="w-full md:w-auto">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Loan
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="retirement" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-age">Current Age</Label>
                <Input
                  id="current-age"
                  type="number"
                  step="1"
                  placeholder="30"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retirement-age">Retirement Age</Label>
                <Input
                  id="retirement-age"
                  type="number"
                  step="1"
                  placeholder="65"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current-savings">Current Savings ({getCurrencySymbol(currency)})</Label>
                <Input
                  id="current-savings"
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthly-savings">Monthly Savings ({getCurrencySymbol(currency)})</Label>
                <Input
                  id="monthly-savings"
                  type="number"
                  step="0.01"
                  placeholder="1000"
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expected-return">Expected Annual Return (%)</Label>
                <Input
                  id="expected-return"
                  type="number"
                  step="0.1"
                  placeholder="7"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={calculateRetirement} className="w-full md:w-auto">
                <PiggyBank className="mr-2 h-4 w-4" />
                Calculate Retirement
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Results Display */}
        {results && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Results
              </h3>
              <Button variant="outline" size="sm" onClick={clearFinancialCalculators}>
                Clear
              </Button>
            </div>
            
            {activeTab === 'compound' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Future Value:</span>
                    <Badge variant="secondary" className="font-mono">
                      {formatCurrency(results.futureValue)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Invested:</span>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.totalInvested)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Contributions:</span>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.totalContributions)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Earned:</span>
                    <Badge className="font-mono bg-green-100 text-green-800">
                      {formatCurrency(results.totalInterest)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'loan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Payment:</span>
                    <Badge variant="secondary" className="font-mono">
                      {formatCurrency(results.monthlyPayment)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Payment:</span>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.totalPayment)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Principal:</span>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.principal)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Interest:</span>
                    <Badge className="font-mono bg-red-100 text-red-800">
                      {formatCurrency(results.totalInterest)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'retirement' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Retirement Value:</span>
                    <Badge variant="secondary" className="font-mono">
                      {formatCurrency(results.futureValue)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Years to Retirement:</span>
                    <Badge variant="outline" className="font-mono">
                      {results.yearsToRetirement} years
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Income (4% rule):</span>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.monthlyIncome)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Interest:</span>
                    <Badge className="font-mono bg-green-100 text-green-800">
                      {formatCurrency(results.totalInterest)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
