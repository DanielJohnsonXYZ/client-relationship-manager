# Code Review Checklist - Prevent Dummy Data Regression

## ✅ Data Integrity Checks

### Before Merging Any PR:

- [ ] **No hardcoded metric changes** - All percentage changes must be calculated from real data
- [ ] **No hardcoded response times** - Must use `calculateAverageResponseTime()` function
- [ ] **No placeholder environment variables** - All configs must be real or properly validated
- [ ] **All metrics use `CalculatedMetric` interface** - Enforces proper calculation structure
- [ ] **Validation functions are called** - `validateMetricChange()`, `validateResponseTime()` used where needed

### API Integration Checks:

- [ ] **Real API data flows to database** - No dummy data fallbacks in API routes
- [ ] **Database queries return actual data** - Not hardcoded responses  
- [ ] **Error handling doesn't return dummy data** - Failed API calls should show errors, not fake data
- [ ] **Integration sync logs show real records processed** - No fake `recordsAdded` counts

### Dashboard & Analytics:

- [ ] **Dashboard metrics calculated from database** - Not hardcoded values
- [ ] **Charts use real data points** - No fake trend data
- [ ] **Health scores come from actual client data** - Not dummy scores
- [ ] **Revenue totals calculated from client records** - Not hardcoded amounts

### Testing Requirements:

- [ ] **Tests pass for data flow validation** - Run `npm test __tests__/data-flow.test.ts`
- [ ] **Environment validation passes** - App starts without placeholder warnings
- [ ] **TypeScript compilation succeeds** - Enforced interfaces work correctly

## 🚨 Red Flags - Immediate Rejection

- Any file containing these patterns:
  - `change: +5.2` or similar hardcoded percentage
  - `'2.1 hours'` or `'3.2 hours'` response times  
  - `placeholder` in environment variable values
  - `// TODO: Replace with real data` without implementation
  - Mock data in production API routes

## 📋 Quick Commands

```bash
# Run dummy data detection tests
npm test __tests__/data-flow.test.ts

# Check for hardcoded dummy values
grep -r "5.2\|2.1\|12.3" src/ --exclude-dir=node_modules

# Validate environment setup
npm run dev # Should pass env validation

# Type check enforced interfaces
npm run type-check
```

## 🎯 Developer Guidelines

### When Adding New Metrics:

1. Use `createCalculatedMetric()` factory function
2. Calculate from real database queries
3. Add validation test to prevent regression
4. Document data source in metric

### When Adding New APIs:

1. Store real data in database tables
2. No dummy fallbacks in sync functions  
3. Log actual records processed
4. Add integration to environment validation

### When Working with Charts:

1. Calculate trend data from historical records
2. Use `createTrendData()` for type safety
3. Handle empty data gracefully (don't show fake trends)
4. Add loading states instead of placeholder data

---

**Remember: It's better to show "No data available" than fake data!**