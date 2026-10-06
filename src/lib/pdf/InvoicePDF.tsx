import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceWithRelations } from '@/lib/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  businessName: { fontSize: 18, fontWeight: 'bold' },
  invoiceTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'right' },
  section: { marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 100, color: '#666' },
  value: { flex: 1 },
  table: { marginTop: 16 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsBlock: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', marginBottom: 4 },
  grandTotal: { fontWeight: 'bold', fontSize: 12, borderTopWidth: 1, paddingTop: 6 },
  footer: { marginTop: 32, fontSize: 9, color: '#666', textAlign: 'center' },
});

/**
 * Convert any date-like value into a stable display string.
 * React-pdf cannot render Date objects directly.
 */
function formatDate(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '—';
    return value.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return String(value);
}

/**
 * Format a numeric value for display. Handles strings from MySQL
 * (DECIMAL columns come back as strings by default).
 */
function fmt(value: unknown): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InvoicePDF({ invoice }: { invoice: InvoiceWithRelations }) {
  const { business, client, items } = invoice;
  const isPaid = invoice.status === 'paid';
  const balance = Number(invoice.total) - Number(invoice.amount_paid);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName}>{business.name}</Text>
            {business.address ? <Text>{business.address}</Text> : null}
            {business.phone ? <Text>Tel: {business.phone}</Text> : null}
            {business.email ? <Text>{business.email}</Text> : null}
            {business.kra_pin ? <Text>PIN: {business.kra_pin}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>
              {isPaid ? 'RECEIPT' : 'INVOICE'}
            </Text>
            <Text style={{ textAlign: 'right', marginTop: 4 }}>
              {invoice.invoice_number}
            </Text>
          </View>
        </View>

        {/* ---------- Bill To ---------- */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Bill To:</Text>
          <Text>{client.name}</Text>
          {client.phone ? <Text>{client.phone}</Text> : null}
          {client.email ? <Text>{client.email}</Text> : null}
          {client.kra_pin ? <Text>PIN: {client.kra_pin}</Text> : null}
        </View>

        {/* ---------- Dates ---------- */}
        <View style={styles.row}>
          <Text style={styles.label}>Issue Date:</Text>
          <Text style={styles.value}>{formatDate(invoice.issue_date)}</Text>
          <Text style={styles.label}>Due Date:</Text>
          <Text style={styles.value}>{formatDate(invoice.due_date)}</Text>
        </View>

        {/* ---------- Line items ---------- */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Line Total</Text>
          </View>
          {items.map((it, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{it.description}</Text>
              <Text style={styles.colQty}>{String(it.quantity)}</Text>
              <Text style={styles.colPrice}>{fmt(it.unit_price)}</Text>
              <Text style={styles.colTotal}>{fmt(it.line_total)}</Text>
            </View>
          ))}
        </View>

        {/* ---------- Totals ---------- */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{invoice.currency} {fmt(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>VAT</Text>
            <Text>{invoice.currency} {fmt(invoice.tax_amount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total</Text>
            <Text>{invoice.currency} {fmt(invoice.total)}</Text>
          </View>
          {Number(invoice.amount_paid) > 0 ? (
            <>
              <View style={styles.totalRow}>
                <Text>Paid</Text>
                <Text>{invoice.currency} {fmt(invoice.amount_paid)}</Text>
              </View>
              <View style={[styles.totalRow, { fontWeight: 'bold' }]}>
                <Text>Balance</Text>
                <Text>{invoice.currency} {fmt(balance)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* ---------- Payment details ---------- */}
        {(business.mpesa_till || business.mpesa_paybill || business.bank_details) ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Payment Details</Text>
            {business.mpesa_till ? (
              <Text>M-Pesa Till: {business.mpesa_till}</Text>
            ) : null}
            {business.mpesa_paybill ? (
              <Text>M-Pesa Paybill: {business.mpesa_paybill}</Text>
            ) : null}
            {business.bank_details ? (
              <Text>{business.bank_details}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ---------- Notes + Terms ---------- */}
        {invoice.notes ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold' }}>Notes</Text>
            <Text style={{ marginTop: 2 }}>{invoice.notes}</Text>
          </View>
        ) : null}

        {invoice.terms ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>Terms</Text>
            <Text style={{ marginTop: 2 }}>{invoice.terms}</Text>
          </View>
        ) : null}

        {/* ---------- Footer ---------- */}
        <Text style={styles.footer}>
          Thank you for your business. Asante!
        </Text>

        {/* ---------- PAID watermark ---------- */}
        {isPaid ? (
          <Text
            style={{
              position: 'absolute',
              top: '45%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 60,
              color: '#16a34a',
              opacity: 0.15,
              fontWeight: 'bold',
              transform: 'rotate(-20deg)',
            }}
          >
            PAID
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}