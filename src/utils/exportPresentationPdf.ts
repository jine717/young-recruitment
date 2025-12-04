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

// ============================================
// YOUNG BRAND COLORS ONLY - From Brandbook
// ============================================
const COLORS = {
  cream: [253, 250, 240] as [number, number, number],       // #FDFAF0 - Primary background
  boldBlack: [16, 13, 10] as [number, number, number],      // #100D0A - Primary text
  youngBlue: [147, 177, 255] as [number, number, number],   // #93B1FF - Accent/Highlights
  gold: [184, 143, 94] as [number, number, number],         // #B88F5E - Premium/Winner
  khaki: [96, 87, 56] as [number, number, number],          // #605738 - Subtle/Secondary
  
  // Derived colors for design elements
  creamDark: [245, 240, 225] as [number, number, number],   // Slightly darker cream for boxes
  white: [255, 255, 255] as [number, number, number],       // Pure white for contrast text
};

// ============================================
// TYPOGRAPHY - Presentation Style (Larger)
// ============================================
const FONTS = {
  logoTitle: 48,      // YOUNG. logo
  mainTitle: 28,      // Section titles
  subtitle: 20,       // Subtitles
  heading: 16,        // Card headings
  body: 13,           // Body text
  caption: 11,        // Small labels
  tiny: 9,            // Footer/fine print
};

// ============================================
// LAYOUT CONSTANTS - More White Space
// ============================================
const LAYOUT = {
  margin: 25,         // Generous margins
  padding: 15,        // Box padding
  lineHeight: 7,      // Comfortable line spacing
};

function addCreamBackground(doc: jsPDF, pageWidth: number, pageHeight: number) {
  doc.setFillColor(...COLORS.cream);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

function addHeader(doc: jsPDF, pageWidth: number) {
  // Young Blue header bar
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 18, 'F');
  
  // Logo text
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', LAYOUT.margin, 12);
  
  // Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.caption);
  doc.text('Candidate Comparison Report', 55, 12);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number) {
  // Bold Black footer bar
  doc.setFillColor(...COLORS.boldBlack);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  
  // Footer text
  doc.setTextColor(...COLORS.cream);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNum} of ${totalPages}`, LAYOUT.margin, pageHeight - 4);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight - 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('YOUNG RECRUITMENT', pageWidth - LAYOUT.margin, pageHeight - 4, { align: 'right' });
}

// ============================================
// PAGE 1: Cover + Executive Summary
// ============================================
function createPage1(
  doc: jsPDF, 
  options: PresentationExportOptions, 
  pageWidth: number, 
  pageHeight: number
) {
  const { presentationContent, confidence, jobTitle, exportDate = new Date() } = options;
  
  // Cream background
  addCreamBackground(doc, pageWidth, pageHeight);
  
  // Young Blue header section (top portion)
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(0, 0, pageWidth, 95, 'F');
  
  // Logo - YOUNG.
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.logoTitle);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', pageWidth / 2, 40, { align: 'center' });
  
  // Divider line
  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(1.5);
  doc.line(pageWidth / 2 - 50, 52, pageWidth / 2 + 50, 52);
  
  // Tagline
  doc.setFontSize(FONTS.caption);
  doc.setFont('helvetica', 'normal');
  doc.text('UNITE TO DISRUPT', pageWidth / 2, 65, { align: 'center' });
  
  // Executive Summary badge
  doc.setFillColor(...COLORS.boldBlack);
  doc.roundedRect(pageWidth / 2 - 50, 75, 100, 12, 2, 2, 'F');
  doc.setTextColor(...COLORS.cream);
  doc.setFontSize(FONTS.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', pageWidth / 2, 83, { align: 'center' });
  
  // Position info section
  let yPos = 115;
  
  // Position title - prominent
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.mainTitle);
  doc.setFont('helvetica', 'bold');
  doc.text(jobTitle.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  
  // Date and candidate count
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.khaki);
  const dateStr = exportDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`${dateStr}  ·  ${presentationContent.candidate_summary.total_count} candidates evaluated`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 25;
  
  // Separator line
  doc.setDrawColor(...COLORS.khaki);
  doc.setLineWidth(0.5);
  doc.line(LAYOUT.margin + 30, yPos, pageWidth - LAYOUT.margin - 30, yPos);
  
  yPos += 20;
  
  // Executive narrative - italic quote style
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'italic');
  
  const narrativeLines = doc.splitTextToSize(
    `"${presentationContent.executive_narrative}"`, 
    pageWidth - LAYOUT.margin * 2 - 20
  );
  doc.text(narrativeLines, pageWidth / 2, yPos, { align: 'center', maxWidth: pageWidth - LAYOUT.margin * 2 - 20 });
  
  yPos += narrativeLines.length * LAYOUT.lineHeight + 30;
  
  // Key metrics cards - using ONLY brand colors
  const cardWidth = (pageWidth - LAYOUT.margin * 2 - 30) / 3;
  const cardHeight = 55;
  const cardStartX = LAYOUT.margin;
  
  // Card 1: Top Pick - GOLD (Premium)
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(cardStartX, yPos, cardWidth, cardHeight, 4, 4, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP PICK', cardStartX + cardWidth / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(FONTS.heading);
  const topPickName = presentationContent.winner_spotlight.name.length > 12 
    ? presentationContent.winner_spotlight.name.substring(0, 12) + '...'
    : presentationContent.winner_spotlight.name;
  doc.text(topPickName.toUpperCase(), cardStartX + cardWidth / 2, yPos + 38, { align: 'center' });
  
  // Card 2: Score - YOUNG BLUE
  const card2X = cardStartX + cardWidth + 15;
  doc.setFillColor(...COLORS.youngBlue);
  doc.roundedRect(card2X, yPos, cardWidth, cardHeight, 4, 4, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('SCORE', card2X + cardWidth / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(FONTS.mainTitle);
  doc.text(`${presentationContent.winner_spotlight.score}`, card2X + cardWidth / 2, yPos + 40, { align: 'center' });
  
  // Card 3: Confidence - KHAKI
  const card3X = card2X + cardWidth + 15;
  doc.setFillColor(...COLORS.khaki);
  doc.roundedRect(card3X, yPos, cardWidth, cardHeight, 4, 4, 'F');
  doc.setTextColor(...COLORS.cream);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCE', card3X + cardWidth / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(FONTS.heading);
  doc.text(confidence.toUpperCase(), card3X + cardWidth / 2, yPos + 38, { align: 'center' });
  
  // Bold Black footer
  doc.setFillColor(...COLORS.boldBlack);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(...COLORS.cream);
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL  ·  YOUNG RECRUITMENT', pageWidth / 2, pageHeight - 5, { align: 'center' });
}

// ============================================
// PAGE 2: Top Recommendation + Comparison
// ============================================
function createPage2(
  doc: jsPDF, 
  options: PresentationExportOptions, 
  pageWidth: number, 
  pageHeight: number
) {
  const { presentationContent, viableCandidates } = options;
  
  // Cream background
  addCreamBackground(doc, pageWidth, pageHeight);
  
  // Header
  addHeader(doc, pageWidth);
  
  let yPos = 35;
  
  // Section title with Gold accent
  doc.setFillColor(...COLORS.gold);
  doc.rect(LAYOUT.margin, yPos, 4, 20, 'F');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.mainTitle);
  doc.setFont('helvetica', 'bold');
  doc.text('OUR RECOMMENDATION', LAYOUT.margin + 12, yPos + 14);
  
  yPos += 35;
  
  // Winner spotlight box - Gold border
  doc.setFillColor(...COLORS.creamDark);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.roundedRect(LAYOUT.margin, yPos, pageWidth - LAYOUT.margin * 2, 85, 5, 5, 'FD');
  
  // Candidate name
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.mainTitle);
  doc.setFont('helvetica', 'bold');
  doc.text(presentationContent.winner_spotlight.name.toUpperCase(), LAYOUT.margin + LAYOUT.padding, yPos + 22);
  
  // Score badge - Young Blue circle
  doc.setFillColor(...COLORS.youngBlue);
  doc.circle(pageWidth - LAYOUT.margin - 25, yPos + 25, 20, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text(String(presentationContent.winner_spotlight.score), pageWidth - LAYOUT.margin - 25, yPos + 28, { align: 'center' });
  
  // Headline quote
  doc.setTextColor(...COLORS.khaki);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'italic');
  const headlineLines = doc.splitTextToSize(
    `"${presentationContent.winner_spotlight.headline}"`,
    pageWidth - LAYOUT.margin * 2 - 80
  );
  doc.text(headlineLines, LAYOUT.margin + LAYOUT.padding, yPos + 38);
  
  // Key strengths
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY STRENGTHS', LAYOUT.margin + LAYOUT.padding, yPos + 58);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.body);
  presentationContent.winner_spotlight.key_strengths.slice(0, 3).forEach((strength, i) => {
    doc.setFillColor(...COLORS.gold);
    doc.circle(LAYOUT.margin + LAYOUT.padding + 3, yPos + 66 + i * 8, 1.5, 'F');
    doc.text(strength, LAYOUT.margin + LAYOUT.padding + 10, yPos + 68 + i * 8);
  });
  
  yPos += 100;
  
  // Why chosen paragraph
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  const whyChosenLines = doc.splitTextToSize(
    presentationContent.winner_spotlight.why_chosen,
    pageWidth - LAYOUT.margin * 2
  );
  doc.text(whyChosenLines, LAYOUT.margin, yPos);
  
  yPos += whyChosenLines.length * LAYOUT.lineHeight + 20;
  
  // Separator
  doc.setDrawColor(...COLORS.khaki);
  doc.setLineWidth(0.5);
  doc.line(LAYOUT.margin, yPos, pageWidth - LAYOUT.margin, yPos);
  
  yPos += 15;
  
  // CANDIDATE OVERVIEW section
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATE OVERVIEW', LAYOUT.margin, yPos);
  
  yPos += 12;
  
  // Bar chart - using ONLY brand colors
  const maxBarWidth = pageWidth - LAYOUT.margin * 2 - 50;
  const barHeight = 14;
  const barSpacing = 22;
  
  // Filter to show only viable candidates (score > 20)
  const displayCandidates = viableCandidates.filter(c => c.score > 20).slice(0, 4);
  const maxScore = Math.max(...displayCandidates.map(c => c.score), 100);
  
  displayCandidates.forEach((candidate, index) => {
    const barWidth = (candidate.score / maxScore) * maxBarWidth;
    const isWinner = index === 0;
    
    // Candidate name
    doc.setTextColor(...COLORS.boldBlack);
    doc.setFontSize(FONTS.caption);
    doc.setFont('helvetica', isWinner ? 'bold' : 'normal');
    doc.text(candidate.name, LAYOUT.margin, yPos + 4);
    
    // Bar background
    doc.setFillColor(...COLORS.creamDark);
    doc.roundedRect(LAYOUT.margin, yPos + 7, maxBarWidth, barHeight, 2, 2, 'F');
    
    // Bar fill - Young Blue for winner, Khaki for others
    doc.setFillColor(...(isWinner ? COLORS.youngBlue : COLORS.khaki));
    doc.roundedRect(LAYOUT.margin, yPos + 7, barWidth, barHeight, 2, 2, 'F');
    
    // Score label
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(FONTS.caption);
    doc.setFont('helvetica', 'bold');
    if (barWidth > 25) {
      doc.text(String(candidate.score), LAYOUT.margin + 8, yPos + 16);
    } else {
      doc.setTextColor(...COLORS.boldBlack);
      doc.text(String(candidate.score), LAYOUT.margin + barWidth + 5, yPos + 16);
    }
    
    yPos += barSpacing;
  });
  
  // Non-viable message
  if (presentationContent.candidate_summary.non_viable_message) {
    yPos += 5;
    doc.setTextColor(...COLORS.khaki);
    doc.setFontSize(FONTS.tiny);
    doc.setFont('helvetica', 'italic');
    doc.text(presentationContent.candidate_summary.non_viable_message, LAYOUT.margin, yPos);
  }
  
  // Footer
  addFooter(doc, 2, 3, pageWidth, pageHeight);
}

// ============================================
// PAGE 3: Insights + Next Steps
// ============================================
function createPage3(
  doc: jsPDF, 
  options: PresentationExportOptions, 
  pageWidth: number, 
  pageHeight: number
) {
  const { presentationContent } = options;
  
  // Cream background
  addCreamBackground(doc, pageWidth, pageHeight);
  
  // Header
  addHeader(doc, pageWidth);
  
  let yPos = 35;
  
  // KEY INSIGHTS section
  doc.setFillColor(...COLORS.youngBlue);
  doc.rect(LAYOUT.margin, yPos, 4, 20, 'F');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.mainTitle);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY INSIGHTS', LAYOUT.margin + 12, yPos + 14);
  
  yPos += 30;
  
  // Insights box
  doc.setFillColor(...COLORS.creamDark);
  const insightsBoxHeight = Math.max(50, presentationContent.key_insights.length * 14 + 20);
  doc.roundedRect(LAYOUT.margin, yPos, pageWidth - LAYOUT.margin * 2, insightsBoxHeight, 4, 4, 'F');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  
  presentationContent.key_insights.slice(0, 4).forEach((insight, i) => {
    doc.setFillColor(...COLORS.youngBlue);
    doc.circle(LAYOUT.margin + LAYOUT.padding + 3, yPos + 12 + i * 14, 2, 'F');
    doc.text(insight, LAYOUT.margin + LAYOUT.padding + 12, yPos + 14 + i * 14);
  });
  
  yPos += insightsBoxHeight + 20;
  
  // CONSIDERATIONS section
  doc.setFillColor(...COLORS.gold);
  doc.rect(LAYOUT.margin, yPos, 4, 20, 'F');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.mainTitle);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIDERATIONS', LAYOUT.margin + 12, yPos + 14);
  
  yPos += 30;
  
  // Considerations box with Gold border
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1.5);
  const considBoxHeight = Math.max(45, presentationContent.considerations.length * 14 + 16);
  doc.roundedRect(LAYOUT.margin, yPos, pageWidth - LAYOUT.margin * 2, considBoxHeight, 4, 4, 'FD');
  
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.body);
  doc.setFont('helvetica', 'normal');
  
  presentationContent.considerations.slice(0, 3).forEach((consideration, i) => {
    doc.setTextColor(...COLORS.gold);
    doc.text('→', LAYOUT.margin + LAYOUT.padding, yPos + 14 + i * 14);
    doc.setTextColor(...COLORS.boldBlack);
    doc.text(consideration, LAYOUT.margin + LAYOUT.padding + 10, yPos + 14 + i * 14);
  });
  
  yPos += considBoxHeight + 20;
  
  // RECOMMENDED NEXT STEPS section
  doc.setTextColor(...COLORS.boldBlack);
  doc.setFontSize(FONTS.mainTitle);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXT STEPS', LAYOUT.margin, yPos + 14);
  
  yPos += 30;
  
  // Steps box - Young Blue background
  doc.setFillColor(...COLORS.youngBlue);
  const stepsBoxHeight = Math.max(70, presentationContent.next_steps.actions.length * 16 + 40);
  doc.roundedRect(LAYOUT.margin, yPos, pageWidth - LAYOUT.margin * 2, stepsBoxHeight, 4, 4, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.body);
  
  presentationContent.next_steps.actions.slice(0, 3).forEach((action, i) => {
    // Number circle
    doc.setFillColor(...COLORS.white);
    doc.circle(LAYOUT.margin + LAYOUT.padding + 6, yPos + 14 + i * 16, 6, 'F');
    doc.setTextColor(...COLORS.youngBlue);
    doc.setFontSize(FONTS.caption);
    doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), LAYOUT.margin + LAYOUT.padding + 6, yPos + 17 + i * 16, { align: 'center' });
    
    // Action text
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'normal');
    doc.text(action, LAYOUT.margin + LAYOUT.padding + 18, yPos + 17 + i * 16);
  });
  
  // Timeline badge
  const timelineY = yPos + stepsBoxHeight - 22;
  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(0.5);
  doc.line(LAYOUT.margin + LAYOUT.padding, timelineY - 5, pageWidth - LAYOUT.margin - LAYOUT.padding, timelineY - 5);
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.caption);
  doc.setFont('helvetica', 'bold');
  doc.text('TIMELINE:', LAYOUT.margin + LAYOUT.padding, timelineY + 5);
  doc.setFontSize(FONTS.heading);
  doc.text(presentationContent.next_steps.timeline.toUpperCase(), pageWidth - LAYOUT.margin - LAYOUT.padding, timelineY + 5, { align: 'right' });
  
  // Footer
  addFooter(doc, 3, 3, pageWidth, pageHeight);
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================
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
  const filename = `young-executive-report-${sanitizedTitle}-${dateStr}.pdf`;
  
  doc.save(filename);
}
