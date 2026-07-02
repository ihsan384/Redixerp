import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Client, ClientFile, ClientNote, RequirementQuestionnaireData } from "@/types"

// Helper: Convert Hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [229, 57, 53]
}

// Helper: Format Currency (PKR / Generic)
function fmt(n: number): string {
  return `PKR ${n.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Standard REDIX.MEDIA corporate metadata
const REDIX_COORDINATES = {
  name: "REDIX.MEDIA",
  address: "Office 24, Floor 3, Premium Business Center, Block A, Karachi",
  email: "connect@redix.media",
  phone: "+92 300 1234567",
  website: "www.redix.media",
  gst: "GST-PK-9912093"
}

// Helper: Draw Unified REDIX.MEDIA Professional Branded Header
function drawHeader(doc: jsPDF, title: string, docNumber: string) {
  const pageW = 210
  // Top thick colored accent bar (Redix Red: #E53935)
  doc.setFillColor(229, 57, 53)
  doc.rect(0, 0, pageW, 6, "F")

  // Dark title container panel
  doc.setFillColor(15, 15, 15)
  doc.rect(0, 6, pageW, 36, "F")

  // Branded text
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text("REDIX.MEDIA", 15, 24)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text("OPERATIONAL INTELLIGENCE & DIGITAL SOLUTIONS", 15, 30)

  // Document title on top right
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(229, 57, 53) // Red
  doc.text(title.toUpperCase(), pageW - 15, 22, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text(`Doc Ref: ${docNumber}`, pageW - 15, 28, { align: "right" })
  doc.text(`Date: ${new Date().toLocaleDateString("en-PK")}`, pageW - 15, 33, { align: "right" })
}

// Helper: Draw Unified REDIX.MEDIA Professional Branded Footer
function drawFooter(doc: jsPDF, pageNum: number, totalPages = 1) {
  const pageW = 210
  const pageH = 297
  
  // Footer divider line
  doc.setDrawColor(229, 57, 53)
  doc.setLineWidth(0.4)
  doc.line(15, pageH - 20, pageW - 15, pageH - 20)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(110, 110, 110)
  
  // Left: contact info
  doc.text(`${REDIX_COORDINATES.website} | ${REDIX_COORDINATES.email} | ${REDIX_COORDINATES.phone}`, 15, pageH - 14)
  
  // Right: page number
  doc.text(`Page ${pageNum} of ${totalPages}  |  Confidential`, pageW - 15, pageH - 14, { align: "right" })
  
  // Center thanks
  doc.setFont("helvetica", "bold")
  doc.text("THANK YOU FOR WORKING WITH REDIX.MEDIA", pageW / 2, pageH - 9, { align: "center" })
}

// Helper: Draw Party Details Block (From / To)
function drawPartiesBlock(doc: jsPDF, client: Client, startY: number): number {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(229, 57, 53)
  doc.text("AGENCY REPRESENTATION (FROM)", 15, startY)
  doc.text("CLIENT REPRESENTATION (TO)", 110, startY)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(15, 15, 15)
  doc.text(REDIX_COORDINATES.name, 15, startY + 5)
  doc.text(client.company_name, 110, startY + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(60, 60, 60)
  
  const fromLines = [
    REDIX_COORDINATES.address,
    `Email: ${REDIX_COORDINATES.email}`,
    `Phone: ${REDIX_COORDINATES.phone}`,
    `NTN/GST: ${REDIX_COORDINATES.gst}`
  ]
  const toLines = [
    `Contact: ${client.contact_person}`,
    client.address || "No address provided",
    `Email: ${client.email}`,
    `Phone: ${client.phone}`,
    client.gst_number ? `GST: ${client.gst_number}` : "GST/NTN: Exempt"
  ]

  const maxLines = Math.max(fromLines.length, toLines.length)
  for (let i = 0; i < maxLines; i++) {
    if (fromLines[i]) doc.text(fromLines[i], 15, startY + 10 + i * 4)
    if (toLines[i]) doc.text(toLines[i], 110, startY + 10 + i * 4)
  }

  return startY + 10 + maxLines * 4 + 6
}

// Helper: Draw Dual Digital Signatures Block
function drawSignaturesBlock(doc: jsPDF, client: Client, startY: number, hasClientSigned = false, hasAgencySigned = true) {
  const pageW = 210
  const boxW = 80
  const boxH = 26
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.setTextColor(229, 57, 53)
  doc.text("AUTHORIZATION & SIGNATURES", 15, startY)

  // Agency Sign Box
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.rect(15, startY + 3, boxW, boxH)
  if (hasAgencySigned) {
    // Generate simple digital signature text inside
    doc.setFont("courier", "italic")
    doc.setFontSize(11)
    doc.setTextColor(229, 57, 53)
    doc.text("REDIX.MEDIA Digital Sign-off", 20, startY + 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(`IP: 192.168.10.15 | UTC-Stamp: ${new Date().toISOString().slice(0, 10)}`, 18, startY + boxH - 2)
  }
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text("Authorized Agency Signatory", 15 + boxW/2, startY + boxH + 7, { align: "center" })

  // Client Sign Box
  doc.rect(115, startY + 3, boxW, boxH)
  if (hasClientSigned) {
    doc.setFont("courier", "italic")
    doc.setFontSize(11)
    doc.setTextColor(15, 15, 15)
    doc.text(`${client.name} Digitally Verified`, 120, startY + 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(`Verification ID: RDX-CS-${client.id.slice(0, 6).toUpperCase()}`, 118, startY + boxH - 2)
  } else {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(180, 180, 180)
    doc.text("Awaiting Signature / Seal", 115 + boxW/2, startY + 15, { align: "center" })
  }
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text(`Client: ${client.company_name}`, 115 + boxW/2, startY + boxH + 7, { align: "center" })
}


// ============================================================
// 1. Website Development Agreement PDF
// ============================================================
export async function generateWebsiteAgreementPDF(
  client: Client,
  details: {
    agreementNo: string
    platform: string
    scopes: string[]
    startDate: string
    endDate: string
    totalCost: number
    advancePaid: number
    paymentSchedule: string
    revisions: string
    responsibilities: string
    ownership: string
    refundPolicy: string
    supportPeriod: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, "Website Dev Agreement", details.agreementNo)
  let y = drawPartiesBlock(doc, client, 48)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(229, 57, 53)
  doc.text("1. SCOPE OF SERVICES & PLATFORM", 15, y)
  y += 5

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(40, 40, 40)
  doc.text(`Selected Platform: ${details.platform}`, 15, y)
  y += 5
  
  doc.text("Included Deliverables / Scope:", 15, y)
  y += 4
  details.scopes.forEach((scope, index) => {
    doc.rect(18 + (index % 3) * 60, y + Math.floor(index / 3) * 5, 2.5, 2.5)
    doc.text(scope, 22 + (index % 3) * 60, y + 2.2 + Math.floor(index / 3) * 5)
  })
  y += Math.ceil(details.scopes.length / 3) * 5 + 4

  // Project financials and dates
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(229, 57, 53)
  doc.text("2. FINANCIALS & TIMELINE", 15, y)
  y += 5

  const balance = details.totalCost - details.advancePaid
  const financialRows = [
    ["Total Project Cost", fmt(details.totalCost), "Start Date", details.startDate],
    ["Advance Payment Paid", fmt(details.advancePaid), "Estimated Completion", details.endDate],
    ["Balance Outstanding Amount", fmt(balance), "Support SLA Duration", details.supportPeriod]
  ]

  autoTable(doc, {
    startY: y,
    head: [["Financial Parameters", "Value", "Timeline / SLA", "Details"]],
    body: financialRows,
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [15, 15, 15], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    theme: "grid"
  })
  y = (doc as any).lastAutoTable.finalY + 6

  // Legal Clauses
  const clauses = [
    { title: "3. PAYMENT SCHEDULE", content: details.paymentSchedule },
    { title: "4. REVISIONS & QUALITY ASSURANCE", content: details.revisions },
    { title: "5. INTELLECTUAL PROPERTY & CODE OWNERSHIP", content: details.ownership },
    { title: "6. CLIENT COOPERATION & RESPONSABILITIES", content: details.responsibilities },
    { title: "7. CANCELLATION & REFUND POLICY", content: details.refundPolicy }
  ]

  clauses.forEach(clause => {
    if (y > 230) {
      drawFooter(doc, 1, 2)
      doc.addPage()
      drawHeader(doc, "Website Dev Agreement", details.agreementNo)
      y = 48
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(229, 57, 53)
    doc.text(clause.title, 15, y)
    y += 4.5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(60, 60, 60)
    const splitText = doc.splitTextToSize(clause.content, 180)
    doc.text(splitText, 15, y)
    y += splitText.length * 3.8 + 4
  })

  if (y > 220) {
    drawFooter(doc, doc.getNumberOfPages() === 1 ? 1 : 2, doc.getNumberOfPages() === 1 ? 1 : 2)
    doc.addPage()
    drawHeader(doc, "Website Dev Agreement", details.agreementNo)
    y = 48
  }

  y += 5
  drawSignaturesBlock(doc, client, y, details.advancePaid > 0, true)
  drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
  
  doc.save(`Agreement-${client.company_name.replace(/\s+/g, "_")}-${details.agreementNo}.pdf`)
}


// ============================================================
// 2. Quotation PDF
// ============================================================
export async function generateCustomQuotationPDF(
  client: Client,
  details: {
    quotationNo: string
    validity: string
    projectTitle: string
    items: Array<{ service: string; desc: string; qty: number; price: number; taxPercent: number }>
    discount: number
    terms: string
    notes: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, "Project Quotation", details.quotationNo)
  let y = drawPartiesBlock(doc, client, 48)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(229, 57, 53)
  doc.text(`PROJECT NAME: ${details.projectTitle.toUpperCase()}`, 15, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  doc.text(`Quotation Validity: ${details.validity}`, 120, y)
  y += 6

  // Prepare table
  let subtotal = 0
  let totalTax = 0
  const rows = details.items.map((item, idx) => {
    const itemSub = item.qty * item.price
    const itemTax = itemSub * (item.taxPercent / 100)
    const itemTotal = itemSub + itemTax
    subtotal += itemSub
    totalTax += itemTax
    return [
      String(idx + 1),
      item.service,
      item.desc,
      String(item.qty),
      fmt(item.price),
      `${item.taxPercent}%`,
      fmt(itemTotal)
    ]
  })

  const grandTotal = subtotal + totalTax - details.discount

  autoTable(doc, {
    startY: y,
    head: [["S.#", "SERVICE", "DESCRIPTION", "QTY", "UNIT PRICE", "TAX", "TOTAL"]],
    body: rows,
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [229, 57, 53], textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    theme: "striped"
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // Calculation blocks on the right
  const calcX = 140
  const valX = 195
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.text("Subtotal amount:", calcX, y)
  doc.text(fmt(subtotal), valX, y, { align: "right" })
  y += 5

  if (totalTax > 0) {
    doc.text("GST Tax (Unified):", calcX, y)
    doc.text(fmt(totalTax), valX, y, { align: "right" })
    y += 5
  }

  if (details.discount > 0) {
    doc.text("Corporate Discount:", calcX, y)
    doc.text(`-${fmt(details.discount)}`, valX, y, { align: "right" })
    y += 5
  }

  doc.setDrawColor(229, 57, 53)
  doc.line(calcX, y - 2, 195, y - 2)
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Grand Total Value:", calcX, y + 2)
  doc.text(fmt(grandTotal), valX, y + 2, { align: "right" })
  y += 12

  // Terms and notes
  if (y > 230) {
    drawFooter(doc, 1, 2)
    doc.addPage()
    drawHeader(doc, "Project Quotation", details.quotationNo)
    y = 48
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(229, 57, 53)
  doc.text("TERMS AND CONDITIONS", 15, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  const termsText = doc.splitTextToSize(details.terms, 180)
  doc.text(termsText, 15, y)
  y += termsText.length * 3.8 + 6

  if (details.notes) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(229, 57, 53)
    doc.text("IMPORTANT DISCLOSURE / NOTES", 15, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const notesText = doc.splitTextToSize(details.notes, 180)
    doc.text(notesText, 15, y)
  }

  drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
  doc.save(`Quotation-${client.company_name.replace(/\s+/g, "_")}-${details.quotationNo}.pdf`)
}


// ============================================================
// 3. Invoice PDF
// ============================================================
export async function generateCustomInvoicePDF(
  client: Client,
  details: {
    invoiceNo: string
    invoiceDate: string
    dueDate: string
    items: Array<{ service: string; desc: string; qty: number; price: number; taxPercent: number }>
    discount: number
    amountPaid: number
    paymentStatus: 'Paid' | 'Pending' | 'Partially Paid' | string
    upiId: string
    bankName: string
    bankAccount: string
    bankIfsc: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, "Commercial Invoice", details.invoiceNo)
  let y = drawPartiesBlock(doc, client, 48)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.setTextColor(229, 57, 53)
  doc.text("INVOICE SCHEDULE STATUS", 15, y)
  y += 5
  
  // Draw small badge for status
  const stat = details.paymentStatus.toLowerCase()
  let badgeCol: [number, number, number] = [239, 68, 68] // Red
  if (stat === "paid") badgeCol = [34, 197, 94]
  else if (stat === "partially paid" || stat === "partial") badgeCol = [245, 158, 11] // Orange

  doc.setFillColor(badgeCol[0], badgeCol[1], badgeCol[2])
  doc.roundedRect(15, y, 32, 6, 1.2, 1.2, "F")
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  doc.text(details.paymentStatus.toUpperCase(), 31, y + 4.2, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  doc.text(`Due Date: ${details.dueDate}`, 60, y + 4.2)
  doc.text(`Invoice Issue: ${details.invoiceDate}`, 120, y + 4.2)
  y += 10

  // Calculate items
  let subtotal = 0
  let totalTax = 0
  const rows = details.items.map((item, idx) => {
    const itemSub = item.qty * item.price
    const itemTax = itemSub * (item.taxPercent / 100)
    const itemTotal = itemSub + itemTax
    subtotal += itemSub
    totalTax += itemTax
    return [
      String(idx + 1),
      item.service,
      item.desc,
      String(item.qty),
      fmt(item.price),
      `${item.taxPercent}%`,
      fmt(itemTotal)
    ]
  })

  const grandTotal = subtotal + totalTax - details.discount
  const balanceDue = Math.max(0, grandTotal - details.amountPaid)

  autoTable(doc, {
    startY: y,
    head: [["S.#", "ITEM DESCRIPTION", "SCOPE", "QTY", "RATE", "TAX", "TOTAL"]],
    body: rows,
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [15, 15, 15], textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    theme: "striped"
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // Totals calculations
  const calcX = 140
  const valX = 195
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text("Subtotal:", calcX, y)
  doc.text(fmt(subtotal), valX, y, { align: "right" })
  y += 4

  if (totalTax > 0) {
    doc.text("GST Taxes:", calcX, y)
    doc.text(fmt(totalTax), valX, y, { align: "right" })
    y += 4
  }

  if (details.discount > 0) {
    doc.text("Corporate Discount:", calcX, y)
    doc.text(`-${fmt(details.discount)}`, valX, y, { align: "right" })
    y += 4
  }

  doc.text("Amount Paid Received:", calcX, y)
  doc.text(`-${fmt(details.amountPaid)}`, valX, y, { align: "right" })
  y += 5

  doc.setDrawColor(229, 57, 53)
  doc.line(calcX, y - 2, 195, y - 2)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(15, 15, 15)
  doc.text("Grand Total:", calcX, y + 1)
  doc.text(fmt(grandTotal), valX, y + 1, { align: "right" })
  
  // Highlight balance due in red/accent block
  doc.setFillColor(229, 57, 53)
  doc.rect(calcX - 4, y + 4, 60, 7, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text("Balance Due:", calcX, y + 9)
  doc.text(fmt(balanceDue), valX, y + 9, { align: "right" })
  
  // Left side payment instructions
  let payY = (doc as any).lastAutoTable.finalY + 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.setTextColor(229, 57, 53)
  doc.text("REMITTANCE INSTRUCTIONS", 15, payY)
  payY += 5
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  if (details.bankName) {
    doc.text(`Bank Name: ${details.bankName}`, 15, payY); payY += 4
    doc.text(`Account No: ${details.bankAccount}`, 15, payY); payY += 4
    doc.text(`IFSC Code: ${details.bankIfsc}`, 15, payY); payY += 4
  }
  if (details.upiId) {
    doc.text(`UPI Address: ${details.upiId}`, 15, payY); payY += 4
    
    // QR Code Placeholder text / simple drawing to look premium
    doc.setDrawColor(200, 200, 200)
    doc.rect(15, payY + 2, 20, 20)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)
    doc.text("UPI SCAN QR", 25, payY + 12, { align: "center" })
    payY += 24
  }

  y = Math.max(y + 16, payY)
  if (y > 230) {
    drawFooter(doc, 1, 2)
    doc.addPage()
    drawHeader(doc, "Commercial Invoice", details.invoiceNo)
    y = 48
  }

  // Draw Signatures Block
  drawSignaturesBlock(doc, client, y, details.amountPaid > 0, true)
  drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
  doc.save(`Invoice-${client.company_name.replace(/\s+/g, "_")}-${details.invoiceNo}.pdf`)
}


// ============================================================
// 4 & 5. Payment Receipt PDF (Advance / Final)
// ============================================================
export async function generatePaymentReceiptPDF(
  client: Client,
  details: {
    receiptNo: string
    receiptType: 'Advance Payment Receipt' | 'Final Payment Receipt' | string
    amountPaid: number
    paymentMode: string
    transactionId: string
    receiptDate: string
    remainingBalance: number
    invoiceLink?: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, details.receiptType, details.receiptNo)
  let y = drawPartiesBlock(doc, client, 48)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("RECEIPT TRANSACTION DETAILS", 15, y)
  y += 6

  const rows = [
    ["Receipt Date Stamp", details.receiptDate],
    ["Payment Classification", details.receiptType],
    ["Net Amount Received", fmt(details.amountPaid)],
    ["Transaction Mode", details.paymentMode],
    ["Reference Transaction ID", details.transactionId],
    ["Linked Commercial Invoice", details.invoiceLink || "N/A"],
    ["Outstanding Balance Remaining", fmt(details.remainingBalance)]
  ]

  autoTable(doc, {
    startY: y,
    head: [["Financial Parameter", "Transaction Details Log"]],
    body: rows,
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [15, 15, 15], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    theme: "striped"
  })

  y = (doc as any).lastAutoTable.finalY + 12

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.setTextColor(229, 57, 53)
  doc.text("ACKNOWLEDGEMENT OF FUNDS", 15, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  
  const receiptAck = `REDIX.MEDIA hereby acknowledges receipt of ${fmt(details.amountPaid)} from ${client.company_name} on date ${details.receiptDate} through ${details.paymentMode}. This receipt is processed digitally. Outstanding balance remains at ${fmt(details.remainingBalance)} in accordance with contract schedules.`
  
  const ackText = doc.splitTextToSize(receiptAck, 180)
  doc.text(ackText, 15, y)
  y += ackText.length * 4.2 + 15

  drawSignaturesBlock(doc, client, y, true, true)
  drawFooter(doc, 1, 1)
  doc.save(`Receipt-${client.company_name.replace(/\s+/g, "_")}-${details.receiptNo}.pdf`)
}


// ============================================================
// 6. Project Proposal PDF
// ============================================================
export async function generateProjectProposalPDF(
  client: Client,
  details: {
    proposalNo: string
    projectTitle: string
    executiveSummary: string
    scopeList: Array<{ title: string; desc: string }>
    timelineWeeks: string
    totalCost: number
    deliverablesText: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  
  // Page 1: Premium Cover Page
  doc.setFillColor(15, 15, 15)
  doc.rect(0, 0, 210, 297, "F")
  
  // Draw decorative REDIX line
  doc.setFillColor(229, 57, 53)
  doc.rect(15, 60, 4, 180, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(32)
  doc.setTextColor(255, 255, 255)
  doc.text("PROJECT PROPOSAL", 30, 85)

  doc.setFontSize(16)
  doc.setTextColor(229, 57, 53)
  doc.text(details.projectTitle.toUpperCase(), 30, 98)

  doc.setFontSize(11)
  doc.setTextColor(180, 180, 180)
  doc.text(`PREPARED BY: REDIX.MEDIA`, 30, 150)
  doc.text(`PREPARED FOR: ${client.company_name}`, 30, 157)
  doc.text(`PROPOSAL REF: ${details.proposalNo}`, 30, 164)
  doc.text(`DATE ISSUED: ${new Date().toLocaleDateString("en-PK")}`, 30, 171)

  drawFooter(doc, 1, 3)

  // Page 2: Executive Summary & Scope
  doc.addPage()
  drawHeader(doc, "Project Proposal", details.proposalNo)
  let y = 48

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("1. EXECUTIVE SUMMARY", 15, y)
  y += 5
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  const execLines = doc.splitTextToSize(details.executiveSummary, 180)
  doc.text(execLines, 15, y)
  y += execLines.length * 4.2 + 8

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("2. DETAILED PROJECT SCOPE", 15, y)
  y += 6

  details.scopeList.forEach(scope => {
    if (y > 250) {
      drawFooter(doc, 2, 3)
      doc.addPage()
      drawHeader(doc, "Project Proposal", details.proposalNo)
      y = 48
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 15, 15)
    doc.text(`• ${scope.title}`, 15, y)
    y += 4.5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(70, 70, 70)
    const scopeDesc = doc.splitTextToSize(scope.desc, 170)
    doc.text(scopeDesc, 20, y)
    y += scopeDesc.length * 4 + 4
  })

  drawFooter(doc, doc.getNumberOfPages(), 3)

  // Page 3: Deliverables & Financial Estimation
  if (doc.getNumberOfPages() < 3) {
    doc.addPage()
  }
  drawHeader(doc, "Project Proposal", details.proposalNo)
  y = 48

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("3. TIMELINE & DELIVERABLES CHECKLIST", 15, y)
  y += 5
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  doc.text(`Estimated Project Timeline: ${details.timelineWeeks}`, 15, y)
  y += 5
  
  const delLines = doc.splitTextToSize(details.deliverablesText, 180)
  doc.text(delLines, 15, y)
  y += delLines.length * 4.2 + 10

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("4. FINANCIAL INVESTMENT SUMMARY", 15, y)
  y += 6

  const investmentRows = [
    ["Corporate Project Core Fee", fmt(details.totalCost)],
    ["Support & Revisions SLA Period", "Included in Core Cost (1-Month)"],
    ["Branding, Server, Setup Assistance", "Complimentary Integration Assistance"]
  ]

  autoTable(doc, {
    startY: y,
    head: [["Investment Component", "Estimated Pricing / Scope"]],
    body: investmentRows,
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [15, 15, 15], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
    theme: "grid"
  })
  
  y = (doc as any).lastAutoTable.finalY + 12
  drawSignaturesBlock(doc, client, y, false, true)

  drawFooter(doc, 3, 3)
  doc.save(`Proposal-${client.company_name.replace(/\s+/g, "_")}-${details.proposalNo}.pdf`)
}


// ============================================================
// 7. Requirement Questionnaire PDF
// ============================================================
export async function generateQuestionnairePDF(
  client: Client,
  qData: RequirementQuestionnaireData
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, "Onboarding Questionnaire", `Q-${client.id.slice(0, 6).toUpperCase()}`)
  let y = 48

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("DIGITAL REQUIREMENTS RECORD SHEET", 15, y)
  y += 6

  const addQRow = (label: string, value: string) => {
    if (y > 260) {
      drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages() + 1)
      doc.addPage()
      drawHeader(doc, "Onboarding Questionnaire", `Q-${client.id.slice(0, 6).toUpperCase()}`)
      y = 48
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 15, 15)
    doc.text(label, 15, y)
    y += 4.5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(value || "Not provided / N/A", 180)
    doc.text(lines, 15, y)
    y += lines.length * 4 + 4
  }

  // Step 1: Business Information
  if (qData.step1) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(229, 57, 53)
    doc.text("STEP 1: CORPORATE / BUSINESS PROFILE", 15, y); y += 6
    addQRow("Corporate Registered Name:", qData.step1.business_name)
    addQRow("Industry / Niche Sector:", qData.step1.industry)
    addQRow("Key Corporate Products:", qData.step1.products)
    addQRow("Provided Core Services:", qData.step1.services)
    addQRow("Specific Target Audience:", qData.step1.target_audience)
  }

  // Step 2: Website Goal
  if (qData.step2) {
    y += 2
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(229, 57, 53)
    doc.text("STEP 2: PRIMARY GOAL OF PLATFORM", 15, y); y += 6
    addQRow("Primary Business Call-to-Action:", qData.step2.website_goal.toUpperCase())
  }

  // Step 3: Design
  if (qData.step3) {
    y += 2
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(229, 57, 53)
    doc.text("STEP 3: AESTHETICS & BRANDING ASSETS", 15, y); y += 6
    addQRow("Preferred Visual Branding Style:", qData.step3.preferred_style.toUpperCase())
    addQRow("Specific Brand Colors Palette:", qData.step3.brand_colors)
    addQRow("Reference Inspiration Websites:", qData.step3.reference_websites)
    addQRow("Desired Fonts & Typography:", qData.step3.fonts)
  }

  // Step 4: Features
  if (qData.step4) {
    y += 2
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(229, 57, 53)
    doc.text("STEP 4: TECHNICAL INTEGRATIONS & UTILITIES", 15, y); y += 6
    addQRow("Enabled Technical Integrations Checklist:", qData.step4.features.join(", ").toUpperCase())
  }

  // Step 5: Content
  if (qData.step5) {
    y += 2
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(229, 57, 53)
    doc.text("STEP 5: REDIX ASSETS CREATION ASSISTANCE", 15, y); y += 6
    const assistants = [
      qData.step5.need_copywriting ? "Copywriting Content Assistance Needed" : "Client providing own copy",
      qData.step5.need_logo ? "Professional Logo Design Assistance Needed" : "Client providing own logo",
      qData.step5.need_images ? "Image Assets Sourcing Needed" : "Client providing own images",
      qData.step5.need_seo ? "On-Page SEO Optimization Setup Needed" : "No SEO requested"
    ]
    addQRow("Requested Asset Creation Pipelines:", assistants.join("\n"))
  }

  // Step 6: Marketing & Timeline
  if (qData.step6) {
    y += 2
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(229, 57, 53)
    doc.text("STEP 6: MARKETING BUDGET & DELIVERY DEADLINE", 15, y); y += 6
    addQRow("Included Digital Marketing Channels:", (qData.step6.marketing || []).join(", ").toUpperCase())
    addQRow("Project Estimated Budget Bracket:", qData.step6.budget)
    addQRow("Delivery Completion Deadline Expected:", qData.step6.timeline)
    addQRow("Additional Structural Notes:", qData.step6.additional_notes)
  }

  drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
  doc.save(`Questionnaire-${client.company_name.replace(/\s+/g, "_")}.pdf`)
}


// ============================================================
// 8. Project Handover Certificate PDF
// ============================================================
export async function generateHandoverPDF(
  client: Client,
  details: {
    handoverNo: string
    handoverDate: string
    deliverables: string[]
    credentials: Array<{ title: string; value: string }>
    supportEnd: string
    recommendations: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, "Project Handover Certificate", details.handoverNo)
  let y = drawPartiesBlock(doc, client, 48)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("1. COMPLETED DELIVERABLES SIGN-OFF", 15, y)
  y += 5

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  details.deliverables.forEach(del => {
    doc.text(`[✓]  ${del}`, 18, y)
    y += 4.5
  })
  y += 4

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("2. HOSTING & SYSTEM CREDENTIALS SECURE LOG", 15, y)
  y += 5

  const credRows = details.credentials.map(c => [c.title, c.value])
  autoTable(doc, {
    startY: y,
    head: [["Platform Component", "Access / Location Detail"]],
    body: credRows,
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [15, 15, 15], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    theme: "grid"
  })

  y = (doc as any).lastAutoTable.finalY + 8

  if (y > 230) {
    drawFooter(doc, 1, 2)
    doc.addPage()
    drawHeader(doc, "Project Handover Certificate", details.handoverNo)
    y = 48
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(229, 57, 53)
  doc.text("3. SUPPORT PERIOD & MAINTENANCE", 15, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.text(`Complimentary technical support SLA is valid until: ${details.supportEnd}`, 15, y)
  y += 5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Important System Recommendations:", 15, y)
  y += 4.5
  doc.setFont("helvetica", "normal")
  const recText = doc.splitTextToSize(details.recommendations, 180)
  doc.text(recText, 15, y)
  y += recText.length * 4 + 14

  drawSignaturesBlock(doc, client, y, true, true)
  drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
  doc.save(`Handover-${client.company_name.replace(/\s+/g, "_")}-${details.handoverNo}.pdf`)
}


// ============================================================
// 9. Maintenance Agreement PDF
// ============================================================
export async function generateMaintenanceAgreementPDF(
  client: Client,
  details: {
    contractNo: string
    startDate: string
    feeAmount: number
    billingCycle: 'Monthly' | 'Quarterly' | 'Yearly' | string
    scopeDetails: string
    responseTime: string
    terms: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, "Maintenance Contract SLA", details.contractNo)
  let y = drawPartiesBlock(doc, client, 48)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(229, 57, 53)
  doc.text("1. MAINTENANCE CONTRACT TERMS", 15, y)
  y += 5

  const termsRows = [
    ["Maintenance Start Date", details.startDate],
    ["Maintenance License Cost Fee", `${fmt(details.feeAmount)} / ${details.billingCycle}`],
    ["Incident Support SLA Response Time", details.responseTime],
    ["Payment Terms Frequency", details.billingCycle]
  ]

  autoTable(doc, {
    startY: y,
    head: [["SLA Parameter", "Contract Terms Agreed"]],
    body: termsRows,
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [15, 15, 15], textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    theme: "striped"
  })

  y = (doc as any).lastAutoTable.finalY + 8

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(229, 57, 53)
  doc.text("2. SCOPE OF AMC TECHNICAL SERVICES", 15, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(60, 60, 60)
  const amcScope = doc.splitTextToSize(details.scopeDetails, 180)
  doc.text(amcScope, 15, y)
  y += amcScope.length * 4 + 8

  if (y > 210) {
    drawFooter(doc, 1, 2)
    doc.addPage()
    drawHeader(doc, "Maintenance Contract SLA", details.contractNo)
    y = 48
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(229, 57, 53)
  doc.text("3. TERMS OF ENGAGEMENT", 15, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const engagementText = doc.splitTextToSize(details.terms, 180)
  doc.text(engagementText, 15, y)
  y += engagementText.length * 3.8 + 14

  drawSignaturesBlock(doc, client, y, false, true)
  drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
  doc.save(`Maintenance-${client.company_name.replace(/\s+/g, "_")}-${details.contractNo}.pdf`)
}


// ============================================================
// 10. NDA (Non-Disclosure Agreement) PDF
// ============================================================
export async function generateNdaPDF(
  client: Client,
  details: {
    ndaNo: string
    effectiveDate: string
    disclosingParty: string
    receivingParty: string
    confidentialDefinition: string
    remedies: string
    governingLaw: string
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  drawHeader(doc, "Mutual Non-Disclosure Agreement", details.ndaNo)
  let y = drawPartiesBlock(doc, client, 48)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(229, 57, 53)
  doc.text("MUTUAL CONFIDENTIALITY TERMS AND OBLIGATIONS", 15, y)
  y += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(55, 55, 55)
  
  const intro = `This Mutual Non-Disclosure Agreement ("Agreement") is made effective as of ${details.effectiveDate}, between ${details.disclosingParty} and ${details.receivingParty}. The parties agree to discuss digital technology solutions under absolute confidentiality rules.`
  const introLines = doc.splitTextToSize(intro, 180)
  doc.text(introLines, 15, y)
  y += introLines.length * 4 + 6

  const sections = [
    { title: "1. Definition of Confidential Information", content: details.confidentialDefinition },
    { title: "2. Standard Protection of Proprietary Data", content: "The Receiving Party shall limit access to Confidential Information of the Disclosing Party to its employees, consultants, and legal team who need to know and are bound by confidentiality clauses." },
    { title: "3. Legal Remedies and Injunctions", content: details.remedies },
    { title: "4. Governing Jurisdictions", content: details.governingLaw }
  ]

  sections.forEach(sec => {
    if (y > 230) {
      drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages() + 1)
      doc.addPage()
      drawHeader(doc, "Mutual NDA", details.ndaNo)
      y = 48
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(229, 57, 53)
    doc.text(sec.title, 15, y)
    y += 4.5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const contentLines = doc.splitTextToSize(sec.content, 180)
    doc.text(contentLines, 15, y)
    y += contentLines.length * 3.8 + 5
  })

  if (y > 220) {
    drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
    doc.addPage()
    drawHeader(doc, "Mutual NDA", details.ndaNo)
    y = 48
  }

  y += 5
  drawSignaturesBlock(doc, client, y, true, true)
  drawFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages())
  doc.save(`NDA-${client.company_name.replace(/\s+/g, "_")}-${details.ndaNo}.pdf`)
}
