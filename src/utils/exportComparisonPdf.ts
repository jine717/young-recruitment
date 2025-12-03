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
  youngBlueDark: [100, 140, 220] as [number, number, number],
  boldBlack: [16, 13, 10] as [number, number, number],
  gold: [184, 143, 94] as [number, number, number],
  goldLight: [220, 190, 140] as [number, number, number],
  cream: [253, 250, 240] as [number, number, number],
  khaki: [96, 87, 56] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [248, 248, 248] as [number, number, number],
  mediumGray: [140, 140, 140] as [number, number, number],
  darkGray: [80, 80, 80] as [number, number, number],
  success: [34, 160, 84] as [number, number, number],
  successLight: [220, 252, 231] as [number, number, number],
  warning: [217, 119, 6] as [number, number, number],
  warningLight: [254, 243, 199] as [number, number, number],
  danger: [200, 60, 60] as [number, number, number],
  dangerLight: [254, 226, 226] as [number, number, number],
};

// Typography sizes
const FONT = {
  title: 32,
  subtitle: 20,
  sectionHeader: 14,
  subsection: 12,
  body: 10,
  small: 9,
  caption: 8,
};

// Page margins
const MARGIN = {
  left: 15,
  right: 15,
  top: 20,
  bottom: 20,
};

// Sanitize text to fix encoding issues
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x00-\x7F]/g, (char) => {
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
      if (char === 'n' || char === 'N') return 'n';
      return '';
    });
}

// Get score color based on value
function getScoreColor(score: number): [number, number, number] {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
}

// Get score background color
function getScoreBgColor(score: number): [number, number, number] {
  if (score >= 75) return COLORS.successLight;
  if (score >= 50) return COLORS.warningLight;
  return COLORS.dangerLight;
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

// Get risk level based on number of risks
function getRiskLevel(riskCount: number): { label: string; color: [number, number, number]; bgColor: [number, number, number] } {
  if (riskCount === 0) return { label: 'LOW', color: COLORS.success, bgColor: COLORS.successLight };
  if (riskCount <= 2) return { label: 'MEDIUM', color: COLORS.warning, bgColor: COLORS.warningLight };
  return { label: 'HIGH', color: COLORS.danger, bgColor: COLORS.dangerLight };
}

// Add page header (for all pages except cover)
function addPageHeader(doc: jsPDF, pageWidth: number) {
  // Blue accent line at top
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 4, 'F');
  
  // Header content area
  doc.setFillColor(...COLORS.white);
  doc.rect(0, 4, pageWidth, 14, 'F');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', MARGIN.left, 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.mediumGray);
  doc.text('Candidate Comparison Report', pageWidth - MARGIN.right, 12, { align: 'right' });
  
  // Separator line
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(MARGIN.left, 18, pageWidth - MARGIN.right, 18);
}

// Add page footer
function addPageFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number, exportDate: Date) {
  const footerY = pageHeight - 12;
  
  // Separator line
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(MARGIN.left, footerY - 6, pageWidth - MARGIN.right, footerY - 6);
  
  doc.setFontSize(FONT.caption);
  doc.setTextColor(...COLORS.mediumGray);
  
  // Page number centered
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
  
  // Confidential left
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL', MARGIN.left, footerY);
  
  // Date right
  doc.setFont('helvetica', 'normal');
  doc.text(exportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), pageWidth - MARGIN.right, footerY, { align: 'right' });
}

// Add professional cover page
function addCoverPage(doc: jsPDF, jobTitle: string, candidateCount: number, exportDate: Date, pageWidth: number, pageHeight: number) {
  // Full blue header area (larger)
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 110, 'F');
  
  // Subtle gradient effect with darker blue at bottom
  doc.setFillColor(...COLORS.youngBlueDark);
  doc.rect(0, 90, pageWidth, 20, 'F');
  
  // Brand name in white
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', pageWidth / 2, 60, { align: 'center' });
  
  // Gold decorative line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(3);
  doc.line(pageWidth / 2 - 45, 75, pageWidth / 2 + 45, 75);
  
  // Report type label
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.text('RECRUITMENT REPORT', pageWidth / 2, 135, { align: 'center' });
  
  // Main title
  doc.setFontSize(FONT.title);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATE', pageWidth / 2, 155, { align: 'center' });
  doc.text('COMPARISON', pageWidth / 2, 170, { align: 'center' });
  
  // Blue decorative line below title
  doc.setDrawColor(...COLORS.youngBlue);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 55, 180, pageWidth / 2 + 55, 180);
  
  // Position box with cream background
  const boxY = 195;
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1.5);
  doc.roundedRect(25, boxY, pageWidth - 50, 50, 5, 5, 'FD');
  
  // Position label
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'bold');
  doc.text('POSITION', pageWidth / 2, boxY + 15, { align: 'center' });
  
  // Position title
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.setFont('helvetica', 'bold');
  const sanitizedJobTitle = sanitizeText(jobTitle);
  // Handle long job titles
  const titleLines = doc.splitTextToSize(sanitizedJobTitle, pageWidth - 70);
  doc.text(titleLines, pageWidth / 2, boxY + 32, { align: 'center' });
  
  // Metadata cards
  const cardsY = 265;
  const cardWidth = 55;
  const cardSpacing = 15;
  const totalCardsWidth = (cardWidth * 3) + (cardSpacing * 2);
  const startX = (pageWidth - totalCardsWidth) / 2;
  
  // Card 1: Date
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(startX, cardsY, cardWidth, 35, 3, 3, 'F');
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE', startX + cardWidth / 2, cardsY + 12, { align: 'center' });
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subsection);
  const dateStr = exportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  doc.text(dateStr, startX + cardWidth / 2, cardsY + 26, { align: 'center' });
  
  // Card 2: Candidates
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(startX + cardWidth + cardSpacing, cardsY, cardWidth, 35, 3, 3, 'F');
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATES', startX + cardWidth + cardSpacing + cardWidth / 2, cardsY + 12, { align: 'center' });
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.text(String(candidateCount), startX + cardWidth + cardSpacing + cardWidth / 2, cardsY + 26, { align: 'center' });
  
  // Card 3: Status
  doc.setFillColor(...COLORS.successLight);
  doc.roundedRect(startX + (cardWidth + cardSpacing) * 2, cardsY, cardWidth, 35, 3, 3, 'F');
  doc.setTextColor(...COLORS.success);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS', startX + (cardWidth + cardSpacing) * 2 + cardWidth / 2, cardsY + 12, { align: 'center' });
  doc.setFontSize(FONT.small);
  doc.text('COMPLETE', startX + (cardWidth + cardSpacing) * 2 + cardWidth / 2, cardsY + 26, { align: 'center' });
  
  // Prepared by
  doc.setTextColor(...COLORS.mediumGray);
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'normal');
  doc.text('Prepared by Young Recruitment Platform', pageWidth / 2, pageHeight - 50, { align: 'center' });
  
  // Confidential footer
  doc.setFillColor(...COLORS.boldBlack);
  doc.rect(0, pageHeight - 28, pageWidth, 28, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL - FOR INTERNAL USE ONLY', pageWidth / 2, pageHeight - 12, { align: 'center' });
}

// Add section title with decorative line
function addSectionTitle(doc: jsPDF, title: string, yPos: number, lineColor: [number, number, number] = COLORS.youngBlue): number {
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.sectionHeader);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN.left, yPos);
  
  // Decorative underline
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(2);
  const textWidth = doc.getTextWidth(title);
  doc.line(MARGIN.left, yPos + 3, MARGIN.left + textWidth + 10, yPos + 3);
  
  return yPos + 12;
}

// Add executive summary with score visualization
function addExecutiveSummary(doc: jsPDF, result: ComparisonResult, pageWidth: number): number {
  let yPos = 28;
  
  yPos = addSectionTitle(doc, 'EXECUTIVE SUMMARY', yPos);
  
  // Summary text
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.darkGray);
  const summaryLines = doc.splitTextToSize(sanitizeText(result.executive_summary), pageWidth - MARGIN.left - MARGIN.right);
  doc.text(summaryLines, MARGIN.left, yPos);
  yPos += summaryLines.length * 5 + 12;
  
  // Key Metrics Box
  const boxWidth = pageWidth - MARGIN.left - MARGIN.right;
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.goldLight);
  doc.setLineWidth(1);
  doc.roundedRect(MARGIN.left, yPos, boxWidth, 45, 4, 4, 'FD');
  
  const metricsY = yPos + 14;
  const colWidth = boxWidth / 4;
  
  // Metric 1: Total Candidates
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL CANDIDATES', MARGIN.left + colWidth * 0.5, metricsY, { align: 'center' });
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.text(String(result.rankings.length), MARGIN.left + colWidth * 0.5, metricsY + 16, { align: 'center' });
  
  // Metric 2: Top Score
  const topScore = Math.max(...result.rankings.map(r => r.score));
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP SCORE', MARGIN.left + colWidth * 1.5, metricsY, { align: 'center' });
  doc.setTextColor(...getScoreColor(topScore));
  doc.setFontSize(FONT.subtitle);
  doc.text(`${topScore}/100`, MARGIN.left + colWidth * 1.5, metricsY + 16, { align: 'center' });
  
  // Metric 3: Score Range
  const minScore = Math.min(...result.rankings.map(r => r.score));
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('SCORE RANGE', MARGIN.left + colWidth * 2.5, metricsY, { align: 'center' });
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.text(`${minScore} - ${topScore}`, MARGIN.left + colWidth * 2.5, metricsY + 16, { align: 'center' });
  
  // Metric 4: Confidence
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('AI CONFIDENCE', MARGIN.left + colWidth * 3.5, metricsY, { align: 'center' });
  doc.setTextColor(...getConfidenceColor(result.recommendation.confidence));
  doc.setFontSize(FONT.subtitle);
  doc.text(result.recommendation.confidence.toUpperCase(), MARGIN.left + colWidth * 3.5, metricsY + 16, { align: 'center' });
  
  yPos += 55;
  
  // Score Distribution Visual
  yPos = addSectionTitle(doc, 'SCORE DISTRIBUTION', yPos, COLORS.gold);
  
  const barHeight = 12;
  const barMaxWidth = pageWidth - MARGIN.left - MARGIN.right - 80;
  const sortedRankings = [...result.rankings].sort((a, b) => b.score - a.score);
  
  sortedRankings.forEach((ranking, index) => {
    const barY = yPos + (index * (barHeight + 6));
    
    // Candidate name
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(FONT.small);
    doc.setFont('helvetica', 'normal');
    const displayName = sanitizeText(ranking.candidate_name).substring(0, 18);
    doc.text(displayName, MARGIN.left, barY + 8);
    
    // Background bar
    const barX = MARGIN.left + 55;
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(barX, barY, barMaxWidth, barHeight, 2, 2, 'F');
    
    // Score bar
    const barWidth = (ranking.score / 100) * barMaxWidth;
    doc.setFillColor(...getScoreColor(ranking.score));
    doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');
    
    // Score text
    doc.setTextColor(...COLORS.boldBlack);
    doc.setFontSize(FONT.small);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ranking.score}`, barX + barMaxWidth + 8, barY + 8);
    
    // Rank indicator for #1
    if (ranking.rank === 1) {
      doc.setFillColor(...COLORS.gold);
      doc.circle(barX + barMaxWidth + 25, barY + 6, 5, 'F');
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(7);
      doc.text('1', barX + barMaxWidth + 25, barY + 8, { align: 'center' });
    }
  });
  
  yPos += sortedRankings.length * (barHeight + 6) + 10;
  
  return yPos;
}

// Add recommendation section
function addRecommendation(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  if (yPos > pageHeight - 100) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 28;
  }
  
  yPos = addSectionTitle(doc, 'AI RECOMMENDATION', yPos, COLORS.gold);
  
  // Calculate box height based on content
  const justificationLines = doc.splitTextToSize(sanitizeText(result.recommendation.justification), pageWidth - MARGIN.left - MARGIN.right - 25);
  let boxHeight = 50 + (justificationLines.length * 5);
  
  // Add space for alternative if present
  if (result.recommendation.alternative && result.recommendation.alternative_justification) {
    const altLines = doc.splitTextToSize(sanitizeText(result.recommendation.alternative_justification), pageWidth - MARGIN.left - MARGIN.right - 25);
    boxHeight += 20 + (altLines.length * 5);
  }
  
  // Main recommendation box
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1.5);
  doc.roundedRect(MARGIN.left, yPos, pageWidth - MARGIN.left - MARGIN.right, boxHeight, 5, 5, 'FD');
  
  yPos += 15;
  
  // Gold badge with rank
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(MARGIN.left + 8, yPos - 8, 24, 12, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.small);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP PICK', MARGIN.left + 20, yPos, { align: 'center' });
  
  // Top choice name
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizeText(result.recommendation.top_choice), MARGIN.left + 38, yPos);
  
  // Confidence badge
  const confidenceColor = getConfidenceColor(result.recommendation.confidence);
  doc.setFillColor(...confidenceColor);
  const confText = `${result.recommendation.confidence.toUpperCase()} CONFIDENCE`;
  const confWidth = doc.getTextWidth(confText) + 12;
  doc.roundedRect(pageWidth - MARGIN.right - 8 - confWidth, yPos - 8, confWidth, 12, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.caption);
  doc.text(confText, pageWidth - MARGIN.right - 8 - confWidth / 2, yPos, { align: 'center' });
  
  yPos += 12;
  
  // Justification - FULL text, no truncation
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.text(justificationLines, MARGIN.left + 10, yPos);
  yPos += justificationLines.length * 5 + 8;
  
  // Alternative recommendation - FULL text, no truncation
  if (result.recommendation.alternative) {
    doc.setDrawColor(...COLORS.goldLight);
    doc.setLineWidth(0.5);
    doc.line(MARGIN.left + 10, yPos, pageWidth - MARGIN.right - 10, yPos);
    yPos += 8;
    
    doc.setTextColor(...COLORS.khaki);
    doc.setFontSize(FONT.small);
    doc.setFont('helvetica', 'bold');
    doc.text(`ALTERNATIVE: ${sanitizeText(result.recommendation.alternative)}`, MARGIN.left + 10, yPos);
    yPos += 8;
    
    if (result.recommendation.alternative_justification) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.darkGray);
      const altLines = doc.splitTextToSize(sanitizeText(result.recommendation.alternative_justification), pageWidth - MARGIN.left - MARGIN.right - 25);
      doc.text(altLines, MARGIN.left + 10, yPos);
      yPos += altLines.length * 5;
    }
  }
  
  return yPos + 20;
}

// Add rankings table with improved styling
function addRankingsTable(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  if (yPos > pageHeight - 80) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 28;
  }
  
  yPos = addSectionTitle(doc, 'CANDIDATE RANKINGS', yPos);
  
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
    showHead: 'everyPage',
    margin: { left: MARGIN.left, right: MARGIN.right },
    headStyles: {
      fillColor: COLORS.youngBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONT.small,
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: FONT.small,
      cellPadding: 5,
      lineColor: COLORS.lightGray,
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 45 },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    didParseCell: function(data) {
      if (data.column.index === 2 && data.section === 'body') {
        const scoreText = data.cell.raw as string;
        const score = parseInt(scoreText.split('/')[0]);
        data.cell.styles.textColor = getScoreColor(score);
        data.cell.styles.fontStyle = 'bold';
      }
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

// Add comparison matrix with improved page break handling
function addComparisonMatrix(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  if (yPos > pageHeight - 80) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 28;
  }
  
  yPos = addSectionTitle(doc, 'DETAILED COMPARISON MATRIX', yPos);
  
  const matrixHeaders = ['Criterion', ...result.rankings.map(r => sanitizeText(r.candidate_name).substring(0, 12))];
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
    showHead: 'everyPage',
    margin: { left: MARGIN.left, right: MARGIN.right },
    headStyles: {
      fillColor: COLORS.youngBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONT.caption,
      cellPadding: 4,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: FONT.caption,
      cellPadding: 4,
      halign: 'center',
      lineColor: [220, 220, 220],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 45, fillColor: COLORS.cream },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    didParseCell: function(data) {
      if (data.column.index > 0 && data.section === 'body') {
        const score = parseInt(data.cell.raw as string);
        if (!isNaN(score)) {
          data.cell.styles.textColor = getScoreColor(score);
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: function(data) {
      // Add header to new pages created by table overflow
      if (data.pageNumber > 1) {
        addPageHeader(doc, pageWidth);
      }
    },
  });
  
  return (doc as any).lastAutoTable.finalY + 15;
}

// Add risk assessment with card-style layout
function addRiskAssessment(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  if (yPos > pageHeight - 80) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 28;
  }
  
  yPos = addSectionTitle(doc, 'RISK ASSESSMENT', yPos, COLORS.warning);
  
  const cardWidth = pageWidth - MARGIN.left - MARGIN.right;
  const cardPadding = 10;
  
  result.risks.forEach((risk, index) => {
    const riskLevel = getRiskLevel(risk.risks.length);
    
    // Calculate card height based on content
    let cardHeight = 25;
    if (risk.risks.length > 0) {
      cardHeight += risk.risks.length * 14;
    } else {
      cardHeight += 14;
    }
    
    // Check for page break
    if (yPos + cardHeight > pageHeight - 30) {
      doc.addPage();
      addPageHeader(doc, pageWidth);
      yPos = 28;
    }
    
    // Card background
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN.left, yPos, cardWidth, cardHeight, 4, 4, 'FD');
    
    // Left accent bar (color based on risk level)
    doc.setFillColor(...riskLevel.color);
    doc.rect(MARGIN.left, yPos, 4, cardHeight, 'F');
    
    // Candidate name and score
    doc.setTextColor(...COLORS.boldBlack);
    doc.setFontSize(FONT.subsection);
    doc.setFont('helvetica', 'bold');
    const candidateRanking = result.rankings.find(r => r.candidate_name === risk.candidate_name);
    const score = candidateRanking ? candidateRanking.score : 0;
    doc.text(sanitizeText(risk.candidate_name), MARGIN.left + cardPadding + 4, yPos + 12);
    
    // Score badge
    doc.setFillColor(...getScoreBgColor(score));
    doc.roundedRect(MARGIN.left + cardPadding + 60, yPos + 4, 26, 12, 2, 2, 'F');
    doc.setTextColor(...getScoreColor(score));
    doc.setFontSize(FONT.small);
    doc.text(`${score}/100`, MARGIN.left + cardPadding + 73, yPos + 12, { align: 'center' });
    
    // Risk level badge
    doc.setFillColor(...riskLevel.bgColor);
    doc.roundedRect(cardWidth - 35, yPos + 4, 35, 12, 2, 2, 'F');
    doc.setTextColor(...riskLevel.color);
    doc.setFontSize(FONT.caption);
    doc.setFont('helvetica', 'bold');
    doc.text(`${riskLevel.label} RISK`, cardWidth - 17.5, yPos + 12, { align: 'center' });
    
    // Risks list
    let riskY = yPos + 22;
    if (risk.risks.length > 0) {
      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(FONT.small);
      doc.setFont('helvetica', 'normal');
      risk.risks.forEach((riskText) => {
        doc.text(`-  ${sanitizeText(riskText)}`, MARGIN.left + cardPadding + 4, riskY);
        riskY += 14;
      });
    } else {
      doc.setTextColor(...COLORS.success);
      doc.setFontSize(FONT.small);
      doc.setFont('helvetica', 'italic');
      doc.text('No significant risks identified', MARGIN.left + cardPadding + 4, riskY);
    }
    
    yPos += cardHeight + 8;
  });
  
  return yPos + 10;
}

// Add next steps section
function addNextSteps(doc: jsPDF, result: ComparisonResult, yPos: number, pageWidth: number, pageHeight: number): number {
  if (yPos > pageHeight - 100) {
    doc.addPage();
    addPageHeader(doc, pageWidth);
    yPos = 28;
  }
  
  yPos = addSectionTitle(doc, 'RECOMMENDED NEXT STEPS', yPos, COLORS.success);
  
  const boxWidth = pageWidth - MARGIN.left - MARGIN.right;
  
  // Next steps box
  doc.setFillColor(...COLORS.successLight);
  doc.setDrawColor(...COLORS.success);
  doc.setLineWidth(1);
  doc.roundedRect(MARGIN.left, yPos, boxWidth, 70, 4, 4, 'FD');
  
  const steps = [
    `1. Schedule final interview with ${sanitizeText(result.recommendation.top_choice)}`,
    '2. Review detailed candidate profiles and interview notes',
    '3. Conduct reference checks for top candidates',
    result.recommendation.alternative 
      ? `4. Consider ${sanitizeText(result.recommendation.alternative)} as backup option`
      : '4. Discuss findings with hiring team',
    '5. Make final hiring decision within recommended timeline'
  ];
  
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  
  steps.forEach((step, index) => {
    doc.text(step, MARGIN.left + 10, yPos + 14 + (index * 12));
  });
  
  yPos += 85;
  
  // Timeline recommendation
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.gold);
  doc.roundedRect(MARGIN.left, yPos, boxWidth, 30, 4, 4, 'FD');
  
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONT.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED TIMELINE', MARGIN.left + 10, yPos + 12);
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONT.body);
  doc.setFont('helvetica', 'normal');
  doc.text('Complete hiring decision within 5-7 business days to maintain candidate engagement.', MARGIN.left + 10, yPos + 22);
  
  return yPos + 45;
}

export function exportComparisonToPdf({ result, jobTitle, exportDate = new Date() }: ExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Set PDF metadata
  doc.setProperties({
    title: `Candidate Comparison - ${sanitizeText(jobTitle)}`,
    subject: 'Candidate Comparison Report',
    author: 'Young Recruitment Platform',
    keywords: 'recruitment, candidates, comparison, hiring',
    creator: 'Young Recruitment Platform'
  });
  
  // Page 1: Cover Page
  addCoverPage(doc, jobTitle, result.rankings.length, exportDate, pageWidth, pageHeight);
  
  // Page 2: Executive Summary with Score Distribution
  doc.addPage();
  addPageHeader(doc, pageWidth);
  let yPos = addExecutiveSummary(doc, result, pageWidth);
  
  // Recommendation
  yPos = addRecommendation(doc, result, yPos, pageWidth, pageHeight);
  
  // Rankings Table
  yPos = addRankingsTable(doc, result, yPos, pageWidth, pageHeight);
  
  // Comparison Matrix
  yPos = addComparisonMatrix(doc, result, yPos, pageWidth, pageHeight);
  
  // Risk Assessment
  yPos = addRiskAssessment(doc, result, yPos, pageWidth, pageHeight);
  
  // Next Steps
  addNextSteps(doc, result, yPos, pageWidth, pageHeight);
  
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
