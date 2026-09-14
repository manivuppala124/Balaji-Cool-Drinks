import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { formatINR, statusTone, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const PIE_COLORS = ['#0d9488', '#f59e0b', '#06b6d4', '#6366f1', '#ec4899'];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [range, setRange] = useState('last30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [productData, setProductData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'products' | 'inventory'
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { range };
      if (range === 'custom') {
        if (!customFrom || !customTo) {
          toast.error('Select both From and To dates for custom range');
          setLoading(false);
          return;
        }
        params.from = customFrom;
        params.to = customTo;
      }

      const [salesRes, prodRes, invRes] = await Promise.all([
        adminApi.salesReport(params),
        adminApi.productReport(params),
        adminApi.inventoryReport(),
      ]);

      setSalesData(salesRes.data.data);
      setProductData(prodRes.data.data.items || []);
      setInventoryData(invRes.data.data.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (range !== 'custom') {
      loadData();
    }
  }, [range, loadData]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleExportOrders = async () => {
    setExporting(true);
    try {
      const params = { range };
      if (range === 'custom') {
        params.from = customFrom;
        params.to = customTo;
      }
      const res = await adminApi.exportOrders(params);
      downloadBlob(res.data, `orders-${range}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Orders CSV exported');
    } catch (err) {
      toast.error(err.message || 'Failed to export orders');
    } finally {
      setExporting(false);
    }
  };

  const handleExportProducts = async () => {
    setExporting(true);
    try {
      const res = await adminApi.exportProducts();
      downloadBlob(res.data, `products-catalog-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Products CSV exported');
    } catch (err) {
      toast.error(err.message || 'Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  const summary = salesData?.summary || {};
  const byDay = salesData?.byDay || [];
  const byPayment = salesData?.byPayment || [];
  const byType = salesData?.byType || [];
  const byStatus = salesData?.byStatus || [];

  const paymentChartData = byPayment.map((p) => ({
    name: p._id === 'CASH' ? 'Cash at Store' : 'UPI Transfer',
    value: p.sales,
    orders: p.orders,
  }));

  const typeChartData = byType.map((t) => ({
    name: t._id === 'WHOLESALE' ? 'Wholesale' : 'Retail',
    value: t.sales,
    orders: t.orders,
  }));

  const totalStockValuation = inventoryData.reduce(
    (sum, item) => sum + (Number(item.stockValue) || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-ink">Reports & Analytics</h1>
          <p className="text-sm text-muted">Real-time revenue, product performance & inventory insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary text-xs sm:text-sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-secondary text-xs sm:text-sm"
            onClick={handleExportOrders}
            disabled={exporting}
          >
            <Download size={15} /> Export Orders CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary text-xs sm:text-sm"
            onClick={handleExportProducts}
            disabled={exporting}
          >
            <FileSpreadsheet size={15} /> Export Catalog CSV
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="card-soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 mr-1">
              <Calendar size={14} /> Period:
            </span>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  range === opt.value
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-brand-50 border border-brand-100/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              <input
                type="date"
                className="input py-1 px-2.5 text-xs"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                required
              />
              <span className="text-xs text-muted">to</span>
              <input
                type="date"
                className="input py-1 px-2.5 text-xs"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary py-1 px-3 text-xs">
                Apply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-brand-100 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'sales'
              ? 'border-brand-700 text-brand-800 font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Sales & Revenue
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'products'
              ? 'border-brand-700 text-brand-800 font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Product Sales ({productData.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'inventory'
              ? 'border-brand-700 text-brand-800 font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Inventory Valuation ({inventoryData.length})
        </button>
      </div>

      {/* TAB 1: SALES & REVENUE */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-soft p-4">
              <div className="flex items-center justify-between text-muted text-xs font-semibold">
                <span>Gross Revenue</span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <IndianRupee size={16} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-800 font-display text-ink">
                {formatINR(summary.grossSales || 0)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {summary.orders || 0} completed/valid orders
              </p>
            </div>

            <div className="card-soft p-4">
              <div className="flex items-center justify-between text-muted text-xs font-semibold">
                <span>Average Order Value</span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sky-700">
                  <TrendingUp size={16} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-800 font-display text-ink">
                {formatINR(summary.avgOrderValue || 0)}
              </p>
              <p className="mt-1 text-xs text-muted">Per customer order</p>
            </div>

            <div className="card-soft p-4">
              <div className="flex items-center justify-between text-muted text-xs font-semibold">
                <span>Retail vs Wholesale</span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs">
                <span className="font-semibold text-brand-700">
                  Retail: {formatINR(summary.retailRevenue || 0)}
                </span>
                <span className="font-semibold text-accent-600">
                  Wholesale: {formatINR(summary.wholesaleRevenue || 0)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-brand-100 overflow-hidden flex">
                <div
                  className="bg-brand-600 h-full"
                  style={{
                    width: `${
                      summary.grossSales
                        ? ((summary.retailRevenue || 0) / summary.grossSales) * 100
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-accent-500 h-full"
                  style={{
                    width: `${
                      summary.grossSales
                        ? ((summary.wholesaleRevenue || 0) / summary.grossSales) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="card-soft p-4">
              <div className="flex items-center justify-between text-muted text-xs font-semibold">
                <span>Payment Breakdown</span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
                  <IndianRupee size={16} />
                </div>
              </div>
              <p className="mt-2 text-sm font-bold text-ink">
                Cash: {summary.cashOrders || 0} orders · UPI: {summary.upiOrders || 0} orders
              </p>
              <p className="mt-1 text-xs text-muted">
                Delivery Fees: {formatINR(summary.deliveryFees || 0)}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Trend (2 cols) */}
            <div className="card-soft p-5 lg:col-span-2">
              <h2 className="font-display font-700 text-lg">Sales Trend</h2>
              <p className="text-xs text-muted">Revenue timeline over the selected interval</p>
              <div className="mt-4 h-72">
                {byDay.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm text-muted">
                    No order data recorded in this date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="#64748b"
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        formatter={(val) => [formatINR(val), 'Sales']}
                        labelFormatter={(lbl) => `Date: ${lbl}`}
                        contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Gross Sales"
                        stroke="#0f766e"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Payment Mode Donut (1 col) */}
            <div className="card-soft p-5">
              <h2 className="font-display font-700 text-lg">Payment Methods</h2>
              <p className="text-xs text-muted">Cash at Store vs UPI</p>
              <div className="mt-4 h-72">
                {paymentChartData.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm text-muted">
                    No payment data recorded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {paymentChartData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [formatINR(val), 'Revenue']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="card-soft p-5">
            <h2 className="font-display font-700 text-base mb-3">Order Status Distribution</h2>
            <div className="flex flex-wrap gap-2.5">
              {byStatus.map((st) => (
                <div
                  key={st._id}
                  className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs shadow-xs"
                >
                  <span className={`badge ${statusTone(st._id)}`}>{st._id}</span>
                  <span className="font-800 text-sm text-ink">{st.count}</span>
                  <span className="text-muted">orders</span>
                </div>
              ))}
              {byStatus.length === 0 && (
                <p className="text-xs text-muted">No orders in this period.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT PERFORMANCE */}
      {activeTab === 'products' && (
        <div className="card-soft overflow-hidden">
          <div className="p-4 border-b border-brand-100/70 flex items-center justify-between">
            <div>
              <h2 className="font-display font-700 text-lg">Top Selling Products</h2>
              <p className="text-xs text-muted">Ranked by total revenue generated</p>
            </div>
            <button
              type="button"
              onClick={handleExportOrders}
              className="btn btn-secondary text-xs"
            >
              <Download size={14} /> Export Detailed Sales
            </button>
          </div>

          {!productData.length ? (
            <div className="p-8">
              <EmptyState
                title="No product sales found"
                description="No products were sold during the selected date range."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-50/70 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">#</th>
                    <th className="px-4 py-3 font-bold">Product Name</th>
                    <th className="px-4 py-3 font-bold">Variant / Pack</th>
                    <th className="px-4 py-3 font-bold text-right">Units Sold</th>
                    <th className="px-4 py-3 font-bold text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100/40">
                  {productData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-brand-50/30 transition">
                      <td className="px-4 py-3 font-bold text-muted text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {item._id?.productName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <span className="badge bg-brand-50 text-brand-800 border border-brand-200/60">
                          {item._id?.variantName || 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-800">
                        {formatINR(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVENTORY VALUATION */}
      {activeTab === 'inventory' && (
        <div className="card-soft overflow-hidden">
          <div className="p-4 border-b border-brand-100/70 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-700 text-lg">Inventory Stock & Valuation</h2>
              <p className="text-xs text-muted">
                Total store inventory asset value:{' '}
                <strong className="text-brand-800 font-bold">{formatINR(totalStockValuation)}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportProducts}
              className="btn btn-secondary text-xs"
            >
              <Download size={14} /> Download Inventory Report
            </button>
          </div>

          {!inventoryData.length ? (
            <div className="p-8">
              <EmptyState
                title="No inventory records"
                description="No active catalog items available."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-50/70 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">Product</th>
                    <th className="px-4 py-3 font-bold">Category</th>
                    <th className="px-4 py-3 font-bold">Variant</th>
                    <th className="px-4 py-3 font-bold">SKU</th>
                    <th className="px-4 py-3 font-bold text-right">Retail Price</th>
                    <th className="px-4 py-3 font-bold text-right">Stock</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Est. Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100/40">
                  {inventoryData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-brand-50/30 transition">
                      <td className="px-4 py-3 font-semibold text-ink">
                        {item.product}
                        {item.brand && (
                          <span className="block text-[11px] text-muted">{item.brand}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{item.category || '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{item.variant}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {item.sku || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatINR(item.retailPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-ink">
                        {item.stock}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statusTone(item.status)}`}>
                          {item.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-800">
                        {formatINR(item.stockValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
