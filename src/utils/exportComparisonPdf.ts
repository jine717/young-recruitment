import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComparisonResult } from '@/hooks/useCandidateComparison';

interface ExportOptions {
  result: ComparisonResult;
  jobTitle: string;
  exportDate?: Date;
}

// Brand Colors (RGB)
const COLORS = {
  youngBlue: [147, 177, 255] as [number, number, number],
  boldBlack: [16, 13, 10] as [number, number, number],
  gold: [184, 143, 94] as [number, number, number],
  cream: [253, 250, 240] as [number, number, number],
  khaki: [96, 87, 56] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  mediumGray: [150, 150, 150] as [number, number, number],
  darkGray: [100, 100, 100] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [249, 115, 22] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
};

// Typography sizes
const FONT = {
  title: 28,
  subtitle: 18,
  sectionHeader: 14,
  subsection: 12,
  body: 10,
  small: 9,
  caption: 8,
};

// Sanitize text to fix encoding issues
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/\u2013/g, '-')          // En dash
    .replace(/\u2014/g, '--')         // Em dash
    .replace(/\u2026/g, '...')        // Ellipsis
    .replace(/\u00A0/g, ' ')          // Non-breaking space
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Replace other non-ASCII characters with closest ASCII equivalent
      const charCode = char.charCodeAt(0);
      if (charCode >= 0x00C0 && charCode <= 0x00C5) return 'A';
      if (charCode >= 0x00C8 && charCode <= 0x00CB) return 'E';
      if (charCode >= 0x00CC && charCode <= 0x00CF) return 'I';
      if (charCode >= 0x00D2 && charCode <= 0x00D6) return 'O';
      if (charCode >= 0x00D9 && charCode <= 0x00DC) return 'U';
      if (charCode >= 0x00E0 && charCode <= 0x00E5) return 'a';
      if (charCode >= 0x00E8 && charCode <= 0x00EB) return 'e';
      if (charCode >= 0x00EC && charCode <= 0x00EF) return 'i';
      if (charCode >= 0x00F2 && charCode <= 0x00F6) return 'o';
      if (charCode >= 0x00F9 && charCode <= 0x00FC) return 'u';
      if (char === 'ñ' || char === 'Ñ') return 'n';
      return '';
    });
}

// Get score color based on value
function getScoreColor(score: number): [number, number, number] {
  if (score >= 70) return COLORS.success;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
}

// Get confidence color
function getConfidenceColor(confidence: string): [number, number, number] {
  switch (confidence.toLowerCase()) {
    case 'high': return COLORS.success;
    case 'medium': return COLORS.warning;
    case 'low': return COLORS.danger;
    default: return COLORS.mediumGray;
  }
}

// Add page header
function addPageHeader(doc: jsPDF, pageWidth: number) {
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 12, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', 14, 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Candidate Comparison Report', pageWidth - 14, 8, { align: 'right' });
}

// Add page footer
function addPageFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number, exportDate: Date) {
  const footerY = pageHeight - 10;
  
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  
  doc.setFontSize(FONT.caption);
  doc.setTextColor(...COLORS.mediumGray);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
  doc.text('CONFIDENTIAL', 14, footerY);
  doc.text(exportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), pageWidth - 14, footerY, { align: 'right' });
}

// Add cover page
function addCoverPage(doc: jsPDF, jobTitle: string, candidateCount: number, exportDate: Date, pageWidth: number, pageHeight: number) {
  // Blue header area
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  // Brand name
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', pageWidth / 2, 55, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 40, 70, pageWidth / 2 + 40, 70);
  
  // Report title
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.title);
  doc.text('CANDIDATE COMPARISON', pageWidth / 2, 130, { align: 'center' });
  doc.text('REPORT', pageWidth / 2, 145, { align: 'center' });
  
  // Decorative line below title
  doc.setDrawColor(...COLORS.youngBlue);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 50, 155, pageWidth / 2 + 50, 155);
  
  // Job title box
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.roundedRect(30, 175, pageWidth - 60, 60, 4, 4, 'FD');
  
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.text('POSITION', pageWidth / 2, 190, { align: 'center' });
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.setFont('helvetica', 'bold');
  const sanitizedJobTitle = sanitizeText(jobTitle);
  doc.text(sanitizedJobTitle, pageWidth / 2, 210, { align: 'center' });
  
  // Metadata
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  
  const dateStr = exportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Date: ${dateStr}`, pageWidth / 2, 260, { align: 'center' });
  doc.text(`Candidates Evaluated: ${candidateCount}`, pageWidth / 2, 272, { align: 'center' });
  
  // Confidential footer
  doc.setFillColor(...COLORS.boldBlack);
  doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL - FOR INTERNAL USE ONLY', pageWidth / 2, pageHeight - 12, { align: 'center' });
}

// Add executive summary page
function addExecutiveSummary(doc: jsPDF, result: ComparisonResult, pageWidth: number): number {
  let yPos = 25;
  
  // Section title
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.sectionHeader);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', 14, yPos);
  
  doc.setDrawColor(...COLORS.youngBlue);
  doc.setLineWidth(2);
  doc.line(14, yPos + 3, 80, yPos + 3);
  yPos += 15;
  
  // Summary text
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.darkGray);
  const summaryLines = doc.splitTextToSize(sanitizeText(result.executive_summary), pageWidth - 28);
  doc.text(summaryLines, 14, yPos);
  yPos += summaryLines.length * 5 + 15;
  
  // Key Metrics Box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, yPos, pageWidth - 28, 40, 3, 3, 'F');
  
  const metricsY = yPos + 12;
  const colWidth = (pageWidth - 28) / 4;
  
  // Metric 1: Candidates
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.text('CANDIDATES', 14 + colWidth * 0.5, metricsY, { align: 'center' });
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text(String(result.rankings.length), 14 + colWidth * 0.5, metricsY + 15, { align: 'center' });
  
  // Metric 2: Top Score
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'normal');
  doc.text('TOP SCORE', 14 + colWidth * 1.5, metricsY, { align: 'center' });
  doc.setTextColor(...COLORS.success);
  doc.setFontSize(FONT.subtitle);
  doc.setFont('helvetica', 'bold');
  const topScore = Math.max(...result.rankings.map(r => r.score));
  doc.text(`${topScore}/100`, 14 + colWidth * 1.5, metricsY + 15, { align: 'center' });
  
  // Metric 3: Score Range
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'normal');
  doc.text('SCORE RANGE', 14 + colWidth * 2.5, metricsY, { align: 'center' });
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.setFont('helvetica', 'bold');
  const minScore = Math.min(...result.rankings.map(r => r.score));
  doc.text(`${minScore} - ${topScore}`, 14 + colWidth * 2.5, metricsY + 15, { align: 'center' });
  
  // Metric 4: Confidence
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENCE', 14 + colWidth * 3.5, metricsY, { align: 'center' });
  doc.setTextColor(...getConfidenceColor(result.recommendation.confidence));
  doc.setFontSize(FONT.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text(result.recommendation.confidence.toUpperCase(), 14 + colWidth * 3.5, metricsY + 15, { align: 'center' });
  
  yPos += 55;
  
  return yPos;
}

// Add recommendation section
function addRecommendation(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  // Check if we need a new page
  if (yPos > pageHeight - 100) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 25;
  }
  
  // Section title
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.sectionHeader);
  doc.setFont('helvetica', 'bold');
  doc.text('AI RECOMMENDATION', 14, yPos);
  
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.line(14, yPos + 3, 70, yPos + 3);
  yPos += 12;
  
  // Calculate box height based on content
  const justificationLines = doc.splitTextToSize(sanitizeText(result.recommendation.justification), pageWidth - 48);
  const boxHeight = 45 + (justificationLines.length * 5);
  
  // Recommendation box
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1.5);
  doc.roundedRect(14, yPos, pageWidth - 28, boxHeight, 4, 4, 'FD');
  
  yPos += 12;
  
  // Winner badge
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(20, yPos - 5, 8, 8, 1, 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('1', 24, yPos + 1, { align: 'center' });
  
  // Top choice name
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.text(sanitizeText(result.recommendation.top_choice), 34, yPos + 2);
  
  // Confidence badge
  const confidenceColor = getConfidenceColor(result.recommendation.confidence);
  doc.setFillColor(...confidenceColor);
  const confText = `${result.recommendation.confidence.toUpperCase()} CONFIDENCE`;
  const confWidth = doc.getTextWidth(confText) + 10;
  doc.roundedRect(pageWidth - 20 - confWidth, yPos - 5, confWidth, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.caption);
  doc.text(confText, pageWidth - 20 - confWidth / 2, yPos + 2, { align: 'center' });
  
  yPos += 15;
  
  // Justification
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.text(justificationLines, 20, yPos);
  
  yPos += justificationLines.length * 5 + 5;
  
  // Alternative recommendation (if exists)
  if (result.recommendation.alternative) {
    yPos += 5;
    doc.setTextColor(...COLORS.khaki);
    doc.setFontSize(FONT.small);
    doc.setFont('helvetica', 'bold');
    doc.text(`Alternative: ${sanitizeText(result.recommendation.alternative)}`, 20, yPos);
    
    if (result.recommendation.alternative_justification) {
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.darkGray);
      const altLines = doc.splitTextToSize(sanitizeText(result.recommendation.alternative_justification), pageWidth - 48);
      doc.text(altLines.slice(0, 2), 20, yPos);
      yPos += altLines.slice(0, 2).length * 4;
    }
  }
  
  return yPos + 20;
}

// Add rankings table
function addRankingsTable(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 25;
  }
  
  // Section title
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.sectionHeader);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATE RANKINGS', 14, yPos);
  
  doc.setDrawColor(...COLORS.youngBlue);
  doc.setLineWidth(2);
  doc.line(14, yPos + 3, 75, yPos + 3);
  yPos += 8;
  
  const rankingsData = result.rankings.map((r) => [
    `#${r.rank}`,
    sanitizeText(r.candidate_name),
    `${r.score}/100`,
    sanitizeText(r.key_differentiator)
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Rank', 'Candidate', 'Score', 'Key Differentiator']],
    body: rankingsData,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.youngBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONT.small,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: FONT.small,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 45 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    didParseCell: function(data) {
      // Color code the score column
      if (data.column.index === 2 && data.section === 'body') {
        const scoreText = data.cell.raw as string;
        const score = parseInt(scoreText.split('/')[0]);
        data.cell.styles.textColor = getScoreColor(score);
        data.cell.styles.fontStyle = 'bold';
      }
      // Style rank column
      if (data.column.index === 0 && data.section === 'body') {
        const rank = parseInt((data.cell.raw as string).replace('#', ''));
        if (rank === 1) {
          data.cell.styles.textColor = COLORS.gold;
        }
      }
    },
  });
  
  return (doc as any).lastAutoTable.finalY + 15;
}

// Add comparison matrix
function addComparisonMatrix(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  // Check if we need a new page
  if (yPos > pageHeight - 100) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 25;
  }
  
  // Section title
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.sectionHeader);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED COMPARISON MATRIX', 14, yPos);
  
  doc.setDrawColor(...COLORS.youngBlue);
  doc.setLineWidth(2);
  doc.line(14, yPos + 3, 95, yPos + 3);
  yPos += 8;
  
  const matrixHeaders = ['Criterion', ...result.rankings.map(r => sanitizeText(r.candidate_name))];
  const matrixData = result.comparison_matrix.map((row) => {
    const rowData: string[] = [sanitizeText(row.criterion)];
    result.rankings.forEach((ranking) => {
      const candidate = row.candidates.find(c => c.application_id === ranking.application_id);
      rowData.push(candidate ? `${candidate.score}` : '-');
    });
    return rowData;
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [matrixHeaders],
    body: matrixData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.youngBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONT.caption,
      cellPadding: 3,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: FONT.caption,
      cellPadding: 3,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    didParseCell: function(data) {
      // Color code score cells
      if (data.column.index > 0 && data.section === 'body') {
        const score = parseInt(data.cell.raw as string);
        if (!isNaN(score)) {
          data.cell.styles.textColor = getScoreColor(score);
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  
  return (doc as any).lastAutoTable.finalY + 15;
}

// Add risk assessment
function addRiskAssessment(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 25;
  }
  
  // Section title
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.sectionHeader);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK ASSESSMENT', 14, yPos);
  
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(2);
  doc.line(14, yPos + 3, 60, yPos + 3);
  yPos += 8;
  
  const risksData = result.risks.map((risk) => {
    const riskText = risk.risks.length > 0 
      ? risk.risks.map(r => sanitizeText(r)).join('\n')
      : 'No significant risks identified';
    return [sanitizeText(risk.candidate_name), riskText];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Candidate', 'Identified Risks']],
    body: risksData,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.warning,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONT.small,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: FONT.small,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    didParseCell: function(data) {
      // Color no-risk rows green
      if (data.column.index === 1 && data.section === 'body') {
        const text = data.cell.raw as string;
        if (text === 'No significant risks identified') {
          data.cell.styles.textColor = COLORS.success;
          data.cell.styles.fontStyle = 'italic';
        }
      }
    },
  });
  
  return (doc as any).lastAutoTable.finalY + 15;
}

export function exportComparisonToPdf({ result, jobTitle, exportDate = new Date() }: ExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Set PDF metadata
  doc.setProperties({
    title: `Candidate Comparison - ${sanitizeText(jobTitle)}`,
    subject: 'Candidate Comparison Report',
    author: 'Young Recruitment',
    keywords: 'recruitment, candidates, comparison',
    creator: 'Young Recruitment Platform'
  });
  
  // Page 1: Cover Page
  addCoverPage(doc, jobTitle, result.rankings.length, exportDate, pageWidth, pageHeight);
  
  // Page 2: Executive Summary & Recommendation
  doc.addPage();
  addPageHeader(doc, pageWidth);
  let yPos = addExecutiveSummary(doc, result, pageWidth);
  yPos = addRecommendation(doc, result, yPos, pageWidth, pageHeight);
  
  // Rankings Table
  yPos = addRankingsTable(doc, result, yPos, pageWidth, pageHeight);
  
  // Comparison Matrix
  yPos = addComparisonMatrix(doc, result, yPos, pageWidth, pageHeight);
  
  // Risk Assessment
  addRiskAssessment(doc, result, yPos, pageWidth, pageHeight);
  
  // Add footers to all pages (except cover)
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    addPageFooter(doc, i - 1, pageCount - 1, pageWidth, pageHeight, exportDate);
  }
  
  // Save the PDF
  const sanitizedJobTitle = jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fileName = `candidate-comparison-${sanitizedJobTitle}-${exportDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
