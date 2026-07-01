import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { BillingInvoice, Agreement } from "@/types"

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)] : [229,57,53]
}

function fmt(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function generateInvoicePDF(invoice: BillingInvoice): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const [pr, pg, pb] = hexToRgb(invoice.primary_color || "#e53935")
  const pageW = 210, pageH = 297, margin = 15

  // Header background
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, pageW, 42, "F")

  // Company name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(255,255,255)
  doc.text(invoice.company.name || "Company Name", margin, 18)

  // Invoice label
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("INVOICE", pageW - margin, 12, { align: "right" })

  doc.setFontSize(10)
  doc.text(`#${invoice.invoice_number}`, pageW - margin, 20, { align: "right" })
  doc.text(`Date: ${invoice.invoice_date}`, pageW - margin, 27, { align: "right" })
  doc.text(`Due: ${invoice.due_date}`, pageW - margin, 34, { align: "right" })

  // Status badge
  const statusColors: Record<string, [number,number,number]> = {
    paid: [34,197,94], draft: [161,161,170], sent: [59,130,246], overdue: [239,68,68], partially_paid: [245,158,11]
  }
  const [sr,sg,sb] = statusColors[invoice.status] || [161,161,170]
  doc.setFillColor(sr,sg,sb)
  doc.roundedRect(margin, 32, 28, 8, 2, 2, "F")
  doc.setTextColor(255,255,255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(invoice.status.replace("_"," ").toUpperCase(), margin + 14, 37.5, { align: "center" })

  let y = 52

  // Company + Client Info
  doc.setTextColor(30,30,30)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("FROM", margin, y)
  doc.text("BILL TO", pageW/2 + 5, y)

  y += 5
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(invoice.company.name, margin, y)
  doc.text(invoice.client.name, pageW/2 + 5, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(80,80,80)
  y += 5

  const companyLines = [invoice.company.address, invoice.company.phone, invoice.company.email, invoice.company.gst_number ? `GST: ${invoice.company.gst_number}` : ""].filter(Boolean)
  const clientLines = [invoice.client.company, invoice.client.address, invoice.client.phone, invoice.client.email, invoice.client.gst_number ? `GST: ${invoice.client.gst_number}` : "", invoice.client.project_name ? `Project: ${invoice.client.project_name}` : ""].filter(Boolean)

  const maxLines = Math.max(companyLines.length, clientLines.length)
  for (let i = 0; i < maxLines; i++) {
    if (companyLines[i]) doc.text(companyLines[i], margin, y + i*5)
    if (clientLines[i]) doc.text(clientLines[i], pageW/2 + 5, y + i*5)
  }
  y += maxLines * 5 + 8

  // Divider
  doc.setDrawColor(pr,pg,pb)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // Services table
  const tableRows = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    fmt(item.unit_price),
    item.discount_percent > 0 ? `${item.discount_percent}%` : "-",
    item.tax_percent > 0 ? `${item.tax_percent}%` : "-",
    fmt(item.amount),
  ])

  autoTable(doc, {
    startY: y,
    head: [["DESCRIPTION","QTY","UNIT PRICE","DISCOUNT","TAX","AMOUNT"]],
    body: tableRows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [pr,pg,pb], textColor: [255,255,255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8.5, textColor: [40,40,40] },
    alternateRowStyles: { fillColor: [248,248,250] },
    columnStyles: { 0: { cellWidth: "auto" }, 1: { halign: "center", cellWidth: 16 }, 2: { halign: "right", cellWidth: 28 }, 3: { halign: "center", cellWidth: 22 }, 4: { halign: "center", cellWidth: 16 }, 5: { halign: "right", cellWidth: 28, fontStyle: "bold" } },
    theme: "striped",
  })

  const finalY = (doc as any).lastAutoTable.finalY + 6

  // Totals
  let ty = finalY
  const totalsX = pageW - margin - 70
  const valX = pageW - margin

  const addTotalRow = (label: string, value: string, bold = false, accent = false) => {
    if (accent) { doc.setFillColor(pr,pg,pb); doc.rect(totalsX - 4, ty - 4, 74, 7, "F") }
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setFontSize(bold ? 9.5 : 8.5)
    doc.setTextColor(accent ? 255 : bold ? 30 : 80, accent ? 255 : bold ? 30 : 80, accent ? 255 : bold ? 30 : 80)
    doc.text(label, totalsX, ty); doc.text(value, valX, ty, { align: "right" })
    ty += 6
  }

  addTotalRow("Subtotal", fmt(invoice.subtotal))
  if (invoice.total_discount > 0) addTotalRow("Discount", `-${fmt(invoice.total_discount)}`)
  if (invoice.total_tax > 0) addTotalRow("Tax (GST)", fmt(invoice.total_tax))
  if (invoice.additional_charges > 0) addTotalRow(invoice.additional_charges_label || "Additional Charges", fmt(invoice.additional_charges))
  if (invoice.advance_paid > 0) addTotalRow("Advance Paid", `-${fmt(invoice.advance_paid)}`)

  doc.setDrawColor(pr,pg,pb)
  doc.line(totalsX - 4, ty - 2, valX, ty - 2)
  ty += 2
  addTotalRow("Grand Total", fmt(invoice.grand_total), true)
  addTotalRow("Balance Due", fmt(invoice.balance_due), true, true)

  // Payment Info
  if (invoice.company.bank_account || invoice.company.upi_id) {
    ty += 4
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(pr,pg,pb)
    doc.text("PAYMENT DETAILS", margin, ty)
    ty += 5
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(60,60,60)
    if (invoice.company.bank_name) { doc.text(`Bank: ${invoice.company.bank_name}`, margin, ty); ty += 4 }
    if (invoice.company.bank_account) { doc.text(`Account: ${invoice.company.bank_account}`, margin, ty); ty += 4 }
    if (invoice.company.bank_ifsc) { doc.text(`IFSC: ${invoice.company.bank_ifsc}`, margin, ty); ty += 4 }
    if (invoice.company.upi_id) { doc.text(`UPI: ${invoice.company.upi_id}`, margin, ty); ty += 4 }
  }

  // Notes
  if (invoice.notes) {
    ty += 4
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(pr,pg,pb)
    doc.text("NOTES", margin, ty); ty += 5
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(60,60,60)
    const lines = doc.splitTextToSize(invoice.notes, pageW - 2*margin)
    doc.text(lines, margin, ty); ty += lines.length * 4 + 4
  }

  // Footer
  doc.setFillColor(pr,pg,pb)
  doc.rect(0, pageH - 18, pageW, 18, "F")
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(255,255,255)
  doc.text("Thank you for your business! For queries contact: " + (invoice.company.email || ""), pageW/2, pageH - 10, { align: "center" })
  doc.text(`Page 1 of 1  |  ${invoice.invoice_number}`, pageW/2, pageH - 5, { align: "center" })

  doc.save(`Invoice-${invoice.invoice_number}.pdf`)
}

export async function generateAgreementPDF(agreement: Agreement): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = 210, pageH = 297, margin = 20

  // Header
  doc.setFillColor(20,20,20)
  doc.rect(0, 0, pageW, 45, "F")

  doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(255,255,255)
  doc.text("SERVICE AGREEMENT", margin, 18)
  doc.setFont("helvetica","normal"); doc.setFontSize(10)
  doc.text(`Agreement No: ${agreement.agreement_number}`, margin, 27)
  doc.text(`Date: ${agreement.start_date}`, margin, 34)

  doc.setFontSize(9)
  doc.text(agreement.company.name, pageW - margin, 18, { align: "right" })
  doc.text(agreement.company.email || "", pageW - margin, 26, { align: "right" })
  doc.text(agreement.company.phone || "", pageW - margin, 33, { align: "right" })

  let y = 55

  // Parties
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(20,20,20)
  doc.text("PARTIES TO THE AGREEMENT", margin, y); y += 7

  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(229,57,53)
  doc.text("SERVICE PROVIDER", margin, y)
  doc.text("CLIENT", pageW/2 + 5, y); y += 5

  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(50,50,50)
  const provLines = [agreement.company.name, agreement.company.address, `GST: ${agreement.company.gst_number}`].filter(Boolean)
  const cliLines = [agreement.client_name, agreement.client_company, agreement.client_email, agreement.client_phone].filter(Boolean)
  const mx = Math.max(provLines.length, cliLines.length)
  for (let i = 0; i < mx; i++) {
    if (provLines[i]) doc.text(provLines[i], margin, y + i*4.5)
    if (cliLines[i]) doc.text(cliLines[i], pageW/2 + 5, y + i*4.5)
  }
  y += mx * 4.5 + 6

  // Project Details
  doc.setDrawColor(229,57,53); doc.setLineWidth(0.4); doc.line(margin, y, pageW - margin, y); y += 6
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(20,20,20)
  doc.text("PROJECT DETAILS", margin, y); y += 6
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(50,50,50)
  const details = [
    ["Project Value", `₹${agreement.project_value.toLocaleString("en-IN")}`],
    ["Advance Amount", `₹${agreement.advance_amount.toLocaleString("en-IN")}`],
    ["Balance Amount", `₹${agreement.balance_amount.toLocaleString("en-IN")}`],
    ["Timeline", agreement.delivery_timeline],
    ["Duration", `${agreement.start_date} to ${agreement.end_date}`],
    ["Payment Schedule", agreement.payment_schedule],
  ]
  details.forEach(([label,val]) => {
    doc.setFont("helvetica","bold"); doc.text(`${label}:`, margin, y)
    doc.setFont("helvetica","normal"); doc.text(val, margin + 42, y)
    y += 5.5
  })
  y += 4

  // Sections
  for (const section of agreement.sections.filter(s => s.enabled)) {
    if (y > pageH - 50) { doc.addPage(); y = 20 }
    doc.setDrawColor(229,57,53); doc.line(margin, y, pageW - margin, y); y += 5
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(229,57,53)
    doc.text(section.title.toUpperCase(), margin, y); y += 5
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(50,50,50)
    const bodyLines = doc.splitTextToSize(section.content, pageW - 2*margin)
    if (y + bodyLines.length * 4.5 > pageH - 40) { doc.addPage(); y = 20 }
    doc.text(bodyLines, margin, y); y += bodyLines.length * 4.5 + 6
  }

  // Signatures
  if (y > pageH - 70) { doc.addPage(); y = 20 }
  doc.setDrawColor(50,50,50); doc.line(margin, y, pageW - margin, y); y += 6
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(20,20,20)
  doc.text("SIGNATURES", margin, y); y += 8

  const sigY = y
  // Client signature box
  doc.setDrawColor(200,200,200); doc.rect(margin, sigY, 80, 30)
  if (agreement.client_signature?.data && agreement.client_signature.data.startsWith("data:image")) {
    try { doc.addImage(agreement.client_signature.data, "PNG", margin + 2, sigY + 2, 76, 20) } catch {}
  }
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(80,80,80)
  doc.text("Client Signature", margin + 40, sigY + 33, { align: "center" })
  doc.text(agreement.client_name, margin + 40, sigY + 37, { align: "center" })
  if (agreement.client_signature?.signed_at) doc.text(`Signed: ${new Date(agreement.client_signature.signed_at).toLocaleDateString("en-IN")}`, margin + 40, sigY + 41, { align: "center" })

  // Company signature box
  doc.setDrawColor(200,200,200); doc.rect(pageW/2 + 5, sigY, 80, 30)
  if (agreement.company_signature?.data && agreement.company_signature.data.startsWith("data:image")) {
    try { doc.addImage(agreement.company_signature.data, "PNG", pageW/2 + 7, sigY + 2, 76, 20) } catch {}
  }
  doc.text("Authorized Signatory", pageW/2 + 45, sigY + 33, { align: "center" })
  doc.text(agreement.company.name, pageW/2 + 45, sigY + 37, { align: "center" })
  if (agreement.company_signature?.signed_at) doc.text(`Signed: ${new Date(agreement.company_signature.signed_at).toLocaleDateString("en-IN")}`, pageW/2 + 45, sigY + 41, { align: "center" })

  // Footer
  doc.setFillColor(20,20,20)
  doc.rect(0, pageH - 14, pageW, 14, "F")
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(180,180,180)
  doc.text(`${agreement.agreement_number}  |  Confidential  |  ${agreement.company.name}  |  ${agreement.company.email || ""}`, pageW/2, pageH - 6, { align: "center" })

  doc.save(`Agreement-${agreement.agreement_number}.pdf`)
}
