import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/**
 * WhatsApp Bill & PDF Invoice Generator for Sri Balaji Cool Drinks
 * Formats a clean, readable text receipt, generates professional PDF invoices,
 * and enables direct WhatsApp sharing with both text and PDF attachment.
 */

export const formatWhatsAppBillText = (order, settings) => {
  if (!order) return '';

  const shopName = (settings?.shopName || 'SRI BALAJI COOL DRINKS').toUpperCase();
  const shopAddress = settings?.shopAddress || '';
  const shopPhone = settings?.phoneNumber || '';

  const isInstore = order.orderSource === 'IN_STORE';
  const customerName = isInstore
    ? order.inStoreCustomer?.fullName || 'Walk-in Customer'
    : order.deliveryAddress?.fullName || order.customerId?.fullName || 'Customer';
  const customerMobile = isInstore
    ? order.inStoreCustomer?.mobile || ''
    : order.deliveryAddress?.mobile || order.customerId?.mobile || '';

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const sep = '━━━━━━━━━━━━━━━━━━━━━━';
  const lines = [
    `🧾 *${shopName}*`,
    `_Retail & Wholesale Store_`,
  ];

  if (shopAddress) lines.push(`📍 ${shopAddress}`);
  if (shopPhone) lines.push(`📞 Phone: ${shopPhone}`);

  lines.push(sep);
  lines.push(`*BILL / RECEIPT: ${order.orderNumber}*`);
  lines.push(`📅 *Date:* ${dateStr}`);
  lines.push(`🏷️ *Source:* ${isInstore ? 'In-Store Counter POS' : 'Online Order'}`);
  lines.push(`👤 *Customer:* ${customerName}${customerMobile ? ` (${customerMobile})` : ''}`);
  if (!isInstore && order.deliveryAddress?.addressLine) {
    lines.push(`🏠 *Delivery To:* ${order.deliveryAddress.addressLine}, ${order.deliveryAddress.area || ''}`);
  }

  lines.push(sep);
  lines.push(`*ITEMS ORDERED:*`);

  (order.items || []).forEach((item, index) => {
    const unitLabel = item.sellingUnit === 'CASE' ? 'case(s)' : 'pcs';
    const variantStr = item.variantName ? ` (${item.variantName})` : '';
    lines.push(
      `${index + 1}. *${item.productName}*${variantStr}\n   ${item.quantity} ${unitLabel} × ₹${Number(item.unitPrice).toFixed(2)} = *₹${Number(item.subtotal).toFixed(2)}*`
    );
  });

  lines.push(sep);
  lines.push(`Subtotal: ₹${Number(order.subtotal || 0).toFixed(2)}`);
  if (order.discount > 0) {
    lines.push(`Discount: -₹${Number(order.discount).toFixed(2)}`);
  }
  if (order.deliveryCharge > 0) {
    lines.push(`Delivery Fee: ₹${Number(order.deliveryCharge).toFixed(2)}`);
  }
  lines.push(`*GRAND TOTAL: ₹${Number(order.totalAmount || 0).toFixed(2)}*`);

  lines.push(sep);
  lines.push(`*Payment Mode:* ${order.paymentMethod} (${order.paymentStatus || 'PAID'})`);

  if (order.paymentSplit && order.paymentSplit.length > 0) {
    lines.push(`*Payment Breakdown:*`);
    order.paymentSplit.forEach((split) => {
      const ref = split.reference ? ` [Ref: ${split.reference}]` : '';
      lines.push(`  • ${split.method}: ₹${Number(split.amount).toFixed(2)}${ref}`);
    });
  }

  lines.push(sep);
  // Add online tracking or invoice link if in browser environment
  if (typeof window !== 'undefined' && window.location?.origin && order._id) {
    lines.push(`📄 *View Invoice Online:* ${window.location.origin}/orders/${order._id}`);
  }
  lines.push(`_Thank you for shopping with Sri Balaji Cool Drinks!_`);
  lines.push(`_Visit again!_`);

  return lines.join('\n');
};

export const sanitizeMobileForWhatsApp = (mobile) => {
  if (!mobile) return '';
  const digits = String(mobile).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
};

/**
 * Generates a clean, professional PDF invoice for the order using jsPDF.
 */
export const generateInvoicePdf = (order, settings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks & General Store';
  const shopAddress = settings?.shopAddress || 'Main Road';
  const shopPhone = settings?.phoneNumber || '';

  const isInstore = order.orderSource === 'IN_STORE';
  const customerName = isInstore
    ? order.inStoreCustomer?.fullName || 'Walk-in Customer'
    : order.deliveryAddress?.fullName || order.customerId?.fullName || 'Customer';
  const customerMobile = isInstore
    ? order.inStoreCustomer?.mobile || ''
    : order.deliveryAddress?.mobile || order.customerId?.mobile || '';

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Top Header Banner
  doc.setFillColor(15, 118, 110); // Brand primary teal
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(shopName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${shopAddress} ${shopPhone ? ' · Phone: ' + shopPhone : ''}`, 14, 18);

  // Invoice Title and Meta
  doc.setTextColor(15, 23, 42); // Dark slate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TAX INVOICE / CASH BILL', 14, 34);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Bill No: `, 130, 34);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(order.orderNumber, 150, 34);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: `, 130, 40);
  doc.setTextColor(15, 23, 42);
  doc.text(dateStr, 150, 40);

  doc.setTextColor(100, 116, 139);
  doc.text(`Source: `, 130, 46);
  doc.setTextColor(15, 23, 42);
  doc.text(isInstore ? 'In-Store Counter POS' : 'Online Order', 150, 46);

  // Customer Card (Left)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 40, 105, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('CUSTOMER DETAILS', 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(`Name: ${customerName}`, 18, 52);
  if (customerMobile) {
    doc.text(`Mobile: ${customerMobile}`, 18, 58);
  }

  // Items Table Header
  let y = 72;
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(204, 251, 241);
  doc.rect(14, y, 182, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('ITEM DESCRIPTION', 18, y + 5.5);
  doc.text('UNIT', 105, y + 5.5);
  doc.text('QTY', 125, y + 5.5, { align: 'right' });
  doc.text('PRICE', 155, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', 190, y + 5.5, { align: 'right' });

  y += 8;

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  (order.items || []).forEach((item, idx) => {
    // Check if new page needed
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const rowBg = idx % 2 === 0 ? 255 : 250;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(14, y, 182, 7, 'F');

    const desc = `${item.productName} ${item.variantName ? '(' + item.variantName + ')' : ''}`;
    const unitText = item.sellingUnit === 'CASE' ? 'Case' : 'Piece';

    doc.text(desc.slice(0, 45), 18, y + 5);
    doc.text(unitText, 105, y + 5);
    doc.text(String(item.quantity), 125, y + 5, { align: 'right' });
    doc.text(`Rs. ${Number(item.unitPrice).toFixed(2)}`, 155, y + 5, { align: 'right' });
    doc.text(`Rs. ${Number(item.subtotal).toFixed(2)}`, 190, y + 5, { align: 'right' });

    y += 7;
  });

  // Table bottom border
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  y += 6;

  // Payment Breakdown (Left side) & Totals (Right side)
  const totalsY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('PAYMENT DETAILS', 18, totalsY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Mode: ${order.paymentMethod}`, 18, totalsY + 6);
  doc.text(`Status: ${order.paymentStatus || 'PAID'}`, 18, totalsY + 11);

  let splitY = totalsY + 16;
  if (order.paymentSplit && order.paymentSplit.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Split Breakdown:', 18, splitY);
    doc.setFont('helvetica', 'normal');
    order.paymentSplit.forEach((s) => {
      splitY += 4.5;
      doc.text(`  • ${s.method}: Rs. ${Number(s.amount).toFixed(2)}`, 18, splitY);
    });
  }

  // Totals Column (Right side)
  doc.setFontSize(9.5);
  doc.text('Subtotal:', 140, totalsY);
  doc.text(`Rs. ${Number(order.subtotal || 0).toFixed(2)}`, 190, totalsY, { align: 'right' });

  let curY = totalsY + 6;
  if (order.discount > 0) {
    doc.setTextColor(16, 185, 129); // Green
    doc.text('Discount:', 140, curY);
    doc.text(`-Rs. ${Number(order.discount).toFixed(2)}`, 190, curY, { align: 'right' });
    curY += 6;
  }

  if (order.deliveryCharge > 0) {
    doc.setTextColor(30, 41, 59);
    doc.text('Delivery Charge:', 140, curY);
    doc.text(`Rs. ${Number(order.deliveryCharge).toFixed(2)}`, 190, curY, { align: 'right' });
    curY += 6;
  }

  // Grand Total Box
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(15, 118, 110);
  doc.roundedRect(135, curY, 61, 10, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', 139, curY + 6.8);
  doc.text(`Rs. ${Number(order.totalAmount || 0).toFixed(2)}`, 192, curY + 6.8, { align: 'right' });

  // Footer Note
  const footerY = Math.max(splitY + 12, curY + 20);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Thank you for shopping with Sri Balaji Cool Drinks! Visit again.', 105, footerY + 6, {
    align: 'center',
  });

  return doc;
};

/**
 * Directly downloads the invoice PDF to the user's device.
 */
export const downloadInvoicePdf = (order, settings) => {
  try {
    const doc = generateInvoicePdf(order, settings);
    doc.save(`Invoice-${order.orderNumber}.pdf`);
    toast.success(`Invoice ${order.orderNumber}.pdf downloaded!`);
  } catch (err) {
    toast.error('Failed to generate PDF invoice');
  }
};

/**
 * Opens WhatsApp directly.
 */
export const createWhatsAppBillUrl = (order, settings, targetMobile = '') => {
  const text = formatWhatsAppBillText(order, settings);
  const cleanMobile = sanitizeMobileForWhatsApp(targetMobile);

  if (cleanMobile) {
    return `https://api.whatsapp.com/send?phone=${cleanMobile}&text=${encodeURIComponent(text)}`;
  }
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
};

/**
 * Sends the WhatsApp bill along with PDF invoice.
 * If the device / browser supports navigator.share with files, it attaches the PDF directly!
 * Otherwise, it downloads the PDF automatically and opens WhatsApp with the structured bill text.
 */
export const sendWhatsAppBillWithPdf = async (order, settings, customMobile = null) => {
  let mobile = customMobile;

  if (mobile == null) {
    const isInstore = order.orderSource === 'IN_STORE';
    mobile = isInstore
      ? order.inStoreCustomer?.mobile || ''
      : order.deliveryAddress?.mobile || order.customerId?.mobile || '';
  }

  const billText = formatWhatsAppBillText(order, settings);

  try {
    const doc = generateInvoicePdf(order, settings);
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], `Invoice-${order.orderNumber}.pdf`, {
      type: 'application/pdf',
    });

    // Check if Web Share API with files is supported (works on Android / iPhone Chrome/Safari)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `Invoice ${order.orderNumber}`,
        text: billText,
      });
      toast.success('Shared invoice PDF & bill text via WhatsApp!');
      return;
    }
  } catch (shareErr) {
    // If user cancelled or file share failed, fall through to direct WhatsApp link + PDF download
  }

  // Fallback for Desktop or Browsers where direct file sharing is not supported:
  // 1. Auto-download the PDF so user has the file right in hand
  downloadInvoicePdf(order, settings);

  // 2. Open WhatsApp with the prefilled receipt text
  const cleanMobile = sanitizeMobileForWhatsApp(mobile);
  const waUrl = cleanMobile
    ? `https://api.whatsapp.com/send?phone=${cleanMobile}&text=${encodeURIComponent(billText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(billText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  toast.info('PDF Invoice downloaded! WhatsApp opened with your receipt details.');
};

/**
 * Simple text-based WhatsApp sender (or fallback)
 */
export const sendWhatsAppBill = (order, settings, customMobile = null) => {
  sendWhatsAppBillWithPdf(order, settings, customMobile);
};
