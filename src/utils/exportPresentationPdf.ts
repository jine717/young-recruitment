import jsPDF from 'jspdf';

export interface PresentationContent {
  executive_narrative: string;
  winner_spotlight: {
    name: string;
    score: number;
    headline: string;
    key_strengths: string[];
    why_chosen: string;
  };
  candidate_summary: {
    viable_count: number;
    total_count: number;
    non_viable_message: string;
  };
  key_insights: string[];
  considerations: string[];
  next_steps: {
    actions: string[];
    timeline: string;
  };
}

export interface ViableCandidate {
  name: string;
  score: number;
}

export interface PresentationExportOptions {
  presentationContent: PresentationContent;
  viableCandidates: ViableCandidate[];
  confidence: 'high' | 'medium' | 'low';
  jobTitle: string;
  exportDate?: Date;
}

// Brand colors
const COLORS = {
  youngBlue: [147, 177, 255] as [number, number, number],
  youngBlueDark: [51, 85, 163] as [number, number, number],
  gold: [184, 143, 94] as [number, number, number],
  boldBlack: [16, 13, 10] as [number, number, number],
  cream: [253, 250, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  yellow: [249, 115, 22] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [229, 231, 235] as [number, number, number],
};

const FONTS = {
  title: 32,
  subtitle: 20,
  heading: 16,
  body: 12,
  small: 10,
  tiny: 8,
};

function getScoreColor(score: number): [number, number, number] {
  if (score >= 70) return COLORS.green;
  if (score >= 40) return COLORS.yellow;
  return COLORS.red;
}

function getConfidenceBadge(confidence: string): { text: string; color: [number, number, number] } {
  switch (confidence) {
    case 'high': return { text: 'HIGH CONFIDENCE', color: COLORS.green };
    case 'medium': return { text: 'MEDIUM CONFIDENCE', color: COLORS.yellow };
    case 'low': return { text: 'LOW CONFIDENCE', color: COLORS.red };
    default: return { text: confidence.toUpperCase(), color: COLORS.gray };
  }
}

function addHeader(doc: jsPDF, pageWidth: number, isFirstPage: boolean = false) {
  if (isFirstPage) return; // First page has its own design
  
  // Young blue header bar
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Logo text
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', 15, 10);
  
  // Title
  doc.setFont('helvetica', 'normal');
  doc.text('Candidate Comparison Report', 45, 10);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number) {
  const y = pageHeight - 10;
  
  // Footer line
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(15, y - 5, pageWidth - 15, y - 5);
  
  // Page number
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNum} of ${totalPages}`, 15, y);
  
  // Confidential badge
  doc.text('CONFIDENTIAL', pageWidth - 15, y, { align: 'right' });
}

function createPage1(
  doc: jsPDF, 
  options: PresentationExportOptions, 
  pageWidth: number, 
  pageHeight: number
) {
  const { presentationContent, confidence, jobTitle, exportDate = new Date() } = options;
  const confidenceBadge = getConfidenceBadge(confidence);
  
  // Full page Young Blue header (top third)
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 90, 'F');
  
  // Logo
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.title + 8);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', pageWidth / 2, 35, { align: 'center' });
  
  // Divider line
  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 40, 45, pageWidth / 2 + 40, 45);
  
  // Title
  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'normal');
  doc.text('EXECUTIVE SUMMARY', pageWidth / 2, 60, { align: 'center' });
  
  // Position and date info box
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(30, 100, pageWidth - 60, 35, 3, 3, 'F');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'bold');
  doc.text('Position:', 40, 115);
  doc.setFont('helvetica', 'normal');
  doc.text(jobTitle, 70, 115);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 40, 125);
  doc.setFont('helvetica', 'normal');
  doc.text(exportDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), 55, 125);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Candidates Evaluated:', pageWidth / 2 + 10, 115);
  doc.setFont('helvetica', 'normal');
  doc.text(String(presentationContent.candidate_summary.total_count), pageWidth / 2 + 60, 115);
  
  // Executive narrative
  let yPos = 155;
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'italic');
  
  const narrativeLines = doc.splitTextToSize(
    `"${presentationContent.executive_narrative}"`, 
    pageWidth - 60
  );
  doc.text(narrativeLines, 30, yPos);
  yPos += narrativeLines.length * 6 + 20;
  
  // Key metrics cards
  const cardWidth = (pageWidth - 80) / 3;
  const cardY = yPos;
  const cardHeight = 50;
  
  // Card 1: Top Pick
  doc.setFillColor(...COLORS.youngBlue);
  doc.roundedRect(30, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP PICK', 30 + cardWidth / 2, cardY + 12, { align: 'center' });
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  const topPickName = presentationContent.winner_spotlight.name.length > 15 
    ? presentationContent.winner_spotlight.name.substring(0, 15) + '...'
    : presentationContent.winner_spotlight.name;
  doc.text(topPickName, 30 + cardWidth / 2, cardY + 32, { align: 'center' });
  
  // Card 2: Score
  const scoreColor = getScoreColor(presentationContent.winner_spotlight.score);
  doc.setFillColor(...scoreColor);
  doc.roundedRect(40 + cardWidth, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('SCORE', 40 + cardWidth + cardWidth / 2, cardY + 12, { align: 'center' });
  doc.setFontSize(FONTS.title);
  doc.text(`${presentationContent.winner_spotlight.score}`, 40 + cardWidth + cardWidth / 2, cardY + 35, { align: 'center' });
  
  // Card 3: Confidence
  doc.setFillColor(...confidenceBadge.color);
  doc.roundedRect(50 + cardWidth * 2, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCE', 50 + cardWidth * 2 + cardWidth / 2, cardY + 12, { align: 'center' });
  doc.setFontSize(FONTS.heading);
  doc.text(confidence.toUpperCase(), 50 + cardWidth * 2 + cardWidth / 2, cardY + 32, { align: 'center' });
  
  // Confidential footer
  doc.setFillColor(...COLORS.boldBlack);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight - 6, { align: 'center' });
}

function createPage2(
  doc: jsPDF, 
  options: PresentationExportOptions, 
  pageWidth: number, 
  pageHeight: number
) {
  const { presentationContent, viableCandidates } = options;
  
  addHeader(doc, pageWidth);
  
  let yPos = 30;
  
  // TOP RECOMMENDATION section
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('★ TOP RECOMMENDATION', 15, yPos);
  yPos += 10;
  
  // Winner spotlight box
  doc.setFillColor(...COLORS.youngBlue);
  doc.roundedRect(15, yPos, pageWidth - 30, 80, 5, 5, 'F');
  
  // Candidate name and score
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.subtitle + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(presentationContent.winner_spotlight.name, 25, yPos + 20);
  
  // Score circle
  const scoreColor = getScoreColor(presentationContent.winner_spotlight.score);
  doc.setFillColor(...scoreColor);
  doc.circle(pageWidth - 45, yPos + 25, 18, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text(String(presentationContent.winner_spotlight.score), pageWidth - 45, yPos + 28, { align: 'center' });
  doc.setFontSize(FONTS.tiny);
  doc.text('/100', pageWidth - 45, yPos + 36, { align: 'center' });
  
  // Headline
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'italic');
  const headlineLines = doc.splitTextToSize(
    `"${presentationContent.winner_spotlight.headline}"`,
    pageWidth - 100
  );
  doc.text(headlineLines, 25, yPos + 35);
  
  // Key strengths
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY STRENGTHS:', 25, yPos + 52);
  doc.setFont('helvetica', 'normal');
  presentationContent.winner_spotlight.key_strengths.forEach((strength, i) => {
    doc.text(`• ${strength}`, 30, yPos + 60 + i * 6);
  });
  
  yPos += 95;
  
  // Why chosen section
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  const whyChosenLines = doc.splitTextToSize(
    presentationContent.winner_spotlight.why_chosen,
    pageWidth - 40
  );
  doc.text(whyChosenLines, 20, yPos);
  yPos += whyChosenLines.length * 5 + 15;
  
  // CANDIDATE OVERVIEW
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATE OVERVIEW', 15, yPos);
  yPos += 10;
  
  // Bar chart for viable candidates
  const maxBarWidth = pageWidth - 80;
  const barHeight = 18;
  const barSpacing = 25;
  
  viableCandidates.slice(0, 5).forEach((candidate, index) => {
    const barWidth = (candidate.score / 100) * maxBarWidth;
    const barColor = getScoreColor(candidate.score);
    
    // Candidate name
    doc.setTextColor(...COLORS.boldBlack);
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.text(candidate.name, 20, yPos + 5);
    
    // Bar
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(20, yPos + 8, maxBarWidth, barHeight, 2, 2, 'F');
    doc.setFillColor(...barColor);
    doc.roundedRect(20, yPos + 8, barWidth, barHeight, 2, 2, 'F');
    
    // Score label
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    if (barWidth > 30) {
      doc.text(String(candidate.score), 25, yPos + 19);
    } else {
      doc.setTextColor(...COLORS.boldBlack);
      doc.text(String(candidate.score), barWidth + 25, yPos + 19);
    }
    
    yPos += barSpacing;
  });
  
  // Non-viable message
  if (presentationContent.candidate_summary.non_viable_message) {
    yPos += 5;
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(FONTS.tiny);
    doc.setFont('helvetica', 'italic');
    doc.text(presentationContent.candidate_summary.non_viable_message, 20, yPos);
  }
  
  addFooter(doc, 2, 3, pageWidth, pageHeight);
}

function createPage3(
  doc: jsPDF, 
  options: PresentationExportOptions, 
  pageWidth: number, 
  pageHeight: number
) {
  const { presentationContent } = options;
  
  addHeader(doc, pageWidth);
  
  let yPos = 30;
  
  // KEY INSIGHTS section
  doc.setTextColor(...COLORS.youngBlueDark);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY INSIGHTS', 15, yPos);
  yPos += 8;
  
  // Insights box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'F');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  
  presentationContent.key_insights.forEach((insight, i) => {
    doc.text(`• ${insight}`, 25, yPos + 12 + i * 12);
  });
  
  yPos += 60;
  
  // CONSIDERATIONS section
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIDERATIONS FOR FINAL INTERVIEW', 15, yPos);
  yPos += 8;
  
  // Considerations box
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'FD');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  
  presentationContent.considerations.forEach((consideration, i) => {
    doc.text(`→ ${consideration}`, 25, yPos + 12 + i * 12);
  });
  
  yPos += 55;
  
  // RECOMMENDED NEXT STEPS section
  doc.setTextColor(...COLORS.green);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED NEXT STEPS', 15, yPos);
  yPos += 8;
  
  // Steps box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(...COLORS.green);
  doc.setLineWidth(1);
  doc.roundedRect(15, yPos, pageWidth - 30, 55, 3, 3, 'FD');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  
  presentationContent.next_steps.actions.forEach((action, i) => {
    // Number circle
    doc.setFillColor(...COLORS.green);
    doc.circle(27, yPos + 10 + i * 14, 5, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), 27, yPos + 12 + i * 14, { align: 'center' });
    
    // Action text
    doc.setTextColor(...COLORS.boldBlack);
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'normal');
    doc.text(action, 38, yPos + 12 + i * 14);
  });
  
  yPos += 65;
  
  // Timeline badge
  doc.setFillColor(...COLORS.youngBlue);
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED TIMELINE:', 25, yPos + 15);
  doc.setFontSize(FONTS.heading);
  doc.text(presentationContent.next_steps.timeline, pageWidth - 25, yPos + 15, { align: 'right' });
  
  addFooter(doc, 3, 3, pageWidth, pageHeight);
}

export function exportPresentationToPdf(options: PresentationExportOptions): void {
  const { jobTitle, exportDate = new Date() } = options;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Page 1: Cover + Executive Summary
  createPage1(doc, options, pageWidth, pageHeight);
  
  // Page 2: Top Recommendation + Comparison
  doc.addPage();
  createPage2(doc, options, pageWidth, pageHeight);
  
  // Page 3: Insights + Next Steps
  doc.addPage();
  createPage3(doc, options, pageWidth, pageHeight);
  
  // Generate filename
  const sanitizedTitle = jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const dateStr = exportDate.toISOString().split('T')[0];
  const filename = `executive-report-${sanitizedTitle}-${dateStr}.pdf`;
  
  doc.save(filename);
}
