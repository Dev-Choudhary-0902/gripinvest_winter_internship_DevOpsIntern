import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.transactionLog.deleteMany()
  await prisma.investment.deleteMany()
  // @ts-ignore - product may not exist in current schema
  if ((prisma as any).product?.deleteMany) await (prisma as any).product.deleteMany()
  await prisma.investmentProduct.deleteMany()
  await prisma.user.deleteMany()

  // Optional: create a demo user with password 'Passw0rd!'
  const demoHash = '$2a$10$2dZO3P8xG2n0o6A9kN.i3eG8QdIP7u0M9N4tQ9pX8fK2G3b1Q8T9u' // placeholder hash; replace with actual
  await prisma.user.upsert({
    where: { email: 'demo@grip.local' } as any,
    update: {},
    create: { email: 'demo@grip.local', passwordHash: demoHash, firstName: 'Demo', lastName: 'User', riskAppetite: 'moderate' as any },
  });

  // Enhanced AI-like description helper
  const aiDesc = (name: string, type: string, risk: string, yield: number) => {
    const riskDescriptions = {
      low: 'conservative investment with stable returns and minimal volatility',
      moderate: 'balanced investment offering moderate risk with steady growth potential',
      high: 'aggressive investment with higher volatility but significant growth opportunities'
    };
    
    const typeDescriptions = {
      etf: 'exchange-traded fund tracking market indices with low costs and high liquidity',
      mf: 'mutual fund providing diversified exposure across asset classes with professional management',
      bond: 'government or corporate bonds providing fixed income with capital protection',
      fd: 'fixed deposit offering guaranteed returns with capital protection',
      other: 'alternative investment vehicle with unique risk-return profile'
    };
    
    const riskDesc = riskDescriptions[risk as keyof typeof riskDescriptions] || 'moderate risk';
    const typeDesc = typeDescriptions[type as keyof typeof typeDescriptions] || 'investment product';
    
    return `${name} is a ${typeDesc} designed as a ${riskDesc}. This investment opportunity offers an expected annual yield of ${yield}% and is suitable for investors seeking ${risk === 'low' ? 'capital preservation' : risk === 'high' ? 'aggressive growth' : 'balanced returns'}. The product follows industry best practices for risk management and can be an excellent addition to a well-diversified portfolio.`;
  }

  const products = [
    // ETFs
    { name: 'NIFTY 50 Index ETF', investmentType: 'etf', tenureMonths: 0, annualYield: 12.5, riskLevel: 'moderate', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('NIFTY 50 Index ETF','etf','moderate', 12.5) },
    { name: 'S&P 500 Index ETF', investmentType: 'etf', tenureMonths: 0, annualYield: 10.0, riskLevel: 'moderate', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('S&P 500 Index ETF','etf','moderate', 10.0) },
    { name: 'NASDAQ 100 ETF', investmentType: 'etf', tenureMonths: 0, annualYield: 14.2, riskLevel: 'high', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('NASDAQ 100 ETF','etf','high', 14.2) },
    
    // Mutual Funds
    { name: 'HDFC Corporate Bond Fund', investmentType: 'mf', tenureMonths: 36, annualYield: 7.2, riskLevel: 'low', minInvestment: 1000, maxInvestment: 500000, description: aiDesc('HDFC Corporate Bond Fund','mf','low', 7.2) },
    { name: 'ICICI Prudential Bluechip Fund', investmentType: 'mf', tenureMonths: 24, annualYield: 11.8, riskLevel: 'moderate', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('ICICI Prudential Bluechip Fund','mf','moderate', 11.8) },
    { name: 'SBI Small Cap Fund', investmentType: 'mf', tenureMonths: 60, annualYield: 16.5, riskLevel: 'high', minInvestment: 1000, maxInvestment: 500000, description: aiDesc('SBI Small Cap Fund','mf','high', 16.5) },
    
    // Bonds
    { name: 'Government Securities (G-Sec) 10Y', investmentType: 'bond', tenureMonths: 120, annualYield: 7.0, riskLevel: 'low', minInvestment: 5000, maxInvestment: 10000000, description: aiDesc('Government Securities (G-Sec) 10Y','bond','low', 7.0) },
    { name: 'Corporate Bond AAA 5Y', investmentType: 'bond', tenureMonths: 60, annualYield: 8.5, riskLevel: 'low', minInvestment: 10000, maxInvestment: 5000000, description: aiDesc('Corporate Bond AAA 5Y','bond','low', 8.5) },
    
    // Fixed Deposits
    { name: 'HDFC Bank Fixed Deposit', investmentType: 'fd', tenureMonths: 12, annualYield: 6.5, riskLevel: 'low', minInvestment: 1000, maxInvestment: 2000000, description: aiDesc('HDFC Bank Fixed Deposit','fd','low', 6.5) },
    { name: 'SBI Fixed Deposit', investmentType: 'fd', tenureMonths: 24, annualYield: 7.2, riskLevel: 'low', minInvestment: 1000, maxInvestment: 2000000, description: aiDesc('SBI Fixed Deposit','fd','low', 7.2) },
    
    // Individual Stocks
    { name: 'Apple Inc (AAPL)', investmentType: 'other', tenureMonths: 0, annualYield: 12.0, riskLevel: 'moderate', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('Apple Inc (AAPL)','other','moderate', 12.0) },
    { name: 'NVIDIA (NVDA)', investmentType: 'other', tenureMonths: 0, annualYield: 18.0, riskLevel: 'high', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('NVIDIA (NVDA)','other','high', 18.0) },
    { name: 'Tesla (TSLA)', investmentType: 'other', tenureMonths: 0, annualYield: 16.0, riskLevel: 'high', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('Tesla (TSLA)','other','high', 16.0) },
    { name: 'HDFC Bank', investmentType: 'other', tenureMonths: 0, annualYield: 10.0, riskLevel: 'moderate', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('HDFC Bank','other','moderate', 10.0) },
    { name: 'Reliance Industries', investmentType: 'other', tenureMonths: 0, annualYield: 11.0, riskLevel: 'moderate', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('Reliance Industries','other','moderate', 11.0) },
    { name: 'Infosys', investmentType: 'other', tenureMonths: 0, annualYield: 9.5, riskLevel: 'moderate', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('Infosys','other','moderate', 9.5) },
    
    // Tech Growth Basket
    { name: 'Tech Growth Basket', investmentType: 'other', tenureMonths: 0, annualYield: 15.0, riskLevel: 'high', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('Tech Growth Basket','other','high', 15.0) },
    
    // REITs and Alternative Investments
    { name: 'Real Estate Investment Trust (REIT)', investmentType: 'other', tenureMonths: 0, annualYield: 8.5, riskLevel: 'moderate', minInvestment: 5000, maxInvestment: 2000000, description: aiDesc('Real Estate Investment Trust (REIT)','other','moderate', 8.5) },
    { name: 'Gold ETF', investmentType: 'etf', tenureMonths: 0, annualYield: 6.0, riskLevel: 'low', minInvestment: 1000, maxInvestment: 1000000, description: aiDesc('Gold ETF','etf','low', 6.0) },
  ] as any[]

  for (const p of products) {
    await prisma.investmentProduct.create({ data: p as any })
  }

  console.log('Seed completed. Demo user: demo@grip.local');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


