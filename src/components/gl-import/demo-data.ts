import type { Platform, ParsedGLData } from './types'

export function generateDemoData(platform: Platform): ParsedGLData {
  const categories = [
    { name: 'Office Supplies', type: 'expense' as const },
    { name: 'Rent', type: 'expense' as const },
    { name: 'Software Subscriptions', type: 'expense' as const },
    { name: 'Professional Services', type: 'expense' as const },
    { name: 'Travel & Meals', type: 'expense' as const },
    { name: 'Utilities', type: 'expense' as const },
    { name: 'Insurance', type: 'expense' as const },
    { name: 'Payroll', type: 'expense' as const },
    { name: 'Sales Revenue', type: 'income' as const },
    { name: 'Consulting Revenue', type: 'income' as const },
    { name: 'Accounts Receivable', type: 'asset' as const },
    { name: 'Accounts Payable', type: 'liability' as const },
  ]

  const vendors = [
    { name: 'Amazon Business', normalizedName: 'amazon business' },
    { name: 'WeWork', normalizedName: 'wework' },
    { name: 'Adobe Systems', normalizedName: 'adobe systems' },
    { name: 'Deloitte LLP', normalizedName: 'deloitte llp' },
    { name: 'United Airlines', normalizedName: 'united airlines' },
    { name: 'PG&E', normalizedName: 'pg&e' },
    { name: 'State Farm', normalizedName: 'state farm' },
    { name: 'ADP', normalizedName: 'adp' },
    { name: 'Acme Corp', normalizedName: 'acme corp' },
    { name: 'TechStart Inc', normalizedName: 'techstart inc' },
    { name: 'Gusto', normalizedName: 'gusto' },
    { name: 'Slack Technologies', normalizedName: 'slack technologies' },
    { name: 'Google Cloud', normalizedName: 'google cloud' },
    { name: 'FedEx', normalizedName: 'fedex' },
    { name: 'Staples', normalizedName: 'staples' },
  ]

  const txns = [
    { d: '2025-01-03', desc: 'Monthly office supplies', amt: -284.50, cat: 'Office Supplies', v: 'Amazon Business' },
    { d: '2025-01-05', desc: 'January rent', amt: -4500.00, cat: 'Rent', v: 'WeWork' },
    { d: '2025-01-05', desc: 'Creative Cloud subscription', amt: -599.88, cat: 'Software Subscriptions', v: 'Adobe Systems' },
    { d: '2025-01-08', desc: 'Q4 audit services', amt: -12500.00, cat: 'Professional Services', v: 'Deloitte LLP' },
    { d: '2025-01-10', desc: 'Client meeting travel', amt: -847.30, cat: 'Travel & Meals', v: 'United Airlines' },
    { d: '2025-01-12', desc: 'Electric bill - January', amt: -312.45, cat: 'Utilities', v: 'PG&E' },
    { d: '2025-01-15', desc: 'General liability insurance', amt: -1850.00, cat: 'Insurance', v: 'State Farm' },
    { d: '2025-01-15', desc: 'January payroll', amt: -45200.00, cat: 'Payroll', v: 'ADP' },
    { d: '2025-01-18', desc: 'Product sales - Acme Corp', amt: 28750.00, cat: 'Sales Revenue', v: 'Acme Corp' },
    { d: '2025-01-20', desc: 'Consulting engagement', amt: 15000.00, cat: 'Consulting Revenue', v: 'TechStart Inc' },
    { d: '2025-01-22', desc: 'Payroll processing fees', amt: -189.00, cat: 'Professional Services', v: 'Gusto' },
    { d: '2025-01-23', desc: 'Slack Business+ annual', amt: -1540.00, cat: 'Software Subscriptions', v: 'Slack Technologies' },
    { d: '2025-01-25', desc: 'Cloud infrastructure', amt: -2340.67, cat: 'Software Subscriptions', v: 'Google Cloud' },
    { d: '2025-01-28', desc: 'Client deliverable shipping', amt: -156.80, cat: 'Office Supplies', v: 'FedEx' },
    { d: '2025-01-30', desc: 'Printer paper & toner', amt: -94.30, cat: 'Office Supplies', v: 'Staples' },
    { d: '2025-02-01', desc: 'February rent', amt: -4500.00, cat: 'Rent', v: 'WeWork' },
    { d: '2025-02-03', desc: 'Product sales - TechStart', amt: 31200.00, cat: 'Sales Revenue', v: 'TechStart Inc' },
    { d: '2025-02-05', desc: 'Team lunch meeting', amt: -278.90, cat: 'Travel & Meals', v: 'United Airlines' },
    { d: '2025-02-10', desc: 'Electric bill - February', amt: -298.10, cat: 'Utilities', v: 'PG&E' },
    { d: '2025-02-15', desc: 'February payroll', amt: -45200.00, cat: 'Payroll', v: 'ADP' },
  ]

  return {
    categories,
    vendors,
    transactions: txns.map((t) => ({
      date: t.d,
      description: t.desc,
      amount: t.amt,
      categoryName: t.cat,
      vendorName: t.v,
      source: platform,
    })),
  }
}
