import { query, queryOne } from '@/lib/db';

export async function getDashboardData(businessId: number) {
  const [
    todayRow, outstandingRow, overdueRow, monthRow, lastMonthRow,
    recentInvoices, topClients, recentMpesa,
  ] = await Promise.all([
    queryOne<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count
         FROM invoices
        WHERE business_id = ? AND DATE(issue_date) = CURDATE()
          AND status != 'cancelled'`,
      [businessId]
    ),
    queryOne<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(total - amount_paid),0) as total, COUNT(*) as count
         FROM invoices
        WHERE business_id = ? AND status IN ('sent','partial','overdue')`,
      [businessId]
    ),
    queryOne<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(total - amount_paid),0) as total, COUNT(*) as count
         FROM invoices
        WHERE business_id = ? AND status IN ('sent','partial')
          AND due_date < CURDATE()`,
      [businessId]
    ),
    queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(total),0) as total
         FROM invoices
        WHERE business_id = ? AND status != 'cancelled'
          AND YEAR(issue_date) = YEAR(CURDATE())
          AND MONTH(issue_date) = MONTH(CURDATE())`,
      [businessId]
    ),
    queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(total),0) as total
         FROM invoices
        WHERE business_id = ? AND status != 'cancelled'
          AND YEAR(issue_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
          AND MONTH(issue_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`,
      [businessId]
    ),
    query<any>(
      `SELECT i.id, i.invoice_number, i.total, i.currency, i.status,
              c.name as client_name
         FROM invoices i
         JOIN clients c ON c.id = i.client_id
        WHERE i.business_id = ?
        ORDER BY i.created_at DESC
        LIMIT 5`,
      [businessId]
    ),
    query<any>(
      `SELECT c.id, c.name, COALESCE(SUM(i.total),0) as revenue
         FROM clients c
         JOIN invoices i ON i.client_id = c.id
        WHERE c.business_id = ?
          AND i.status != 'cancelled'
          AND YEAR(i.issue_date) = YEAR(CURDATE())
          AND MONTH(i.issue_date) = MONTH(CURDATE())
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        LIMIT 5`,
      [businessId]
    ),
    query<any>(
      `SELECT id, transaction_code, amount, phone, payer_name, match_status
         FROM mpesa_transactions
        WHERE business_id = ?
        ORDER BY created_at DESC
        LIMIT 5`,
      [businessId]
    ),
  ]);

  return {
    todaySales: Number(todayRow?.total ?? 0),
    todayInvoiceCount: Number(todayRow?.count ?? 0),
    totalOutstanding: Number(outstandingRow?.total ?? 0),
    unpaidCount: Number(outstandingRow?.count ?? 0),
    overdueAmount: Number(overdueRow?.total ?? 0),
    overdueCount: Number(overdueRow?.count ?? 0),
    monthSales: Number(monthRow?.total ?? 0),
    lastMonthSales: Number(lastMonthRow?.total ?? 0),
    recentInvoices,
    topClients,
    recentMpesa,
  };
}