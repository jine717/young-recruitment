import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComparisonResult } from '@/hooks/useCandidateComparison';

interface ExportOptions {
  result: ComparisonResult;
  jobTitle: string;
  exportDate?: Date;
}

export function exportComparisonToPdf({ result, jobTitle, exportDate = new Date() }: ExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Colors - Young brand
  const primaryColor: [number, number, number] = [147, 177, 255]; // Young Blue
  const darkColor: [number, number, number] = [16, 13, 10]; // Bold Black
  const goldColor: [number, number, number] = [184, 143, 94]; // Gold

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUNG.', 14, 18);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Candidate Comparison Report', 14, 30);

  doc.setTextColor(...darkColor);
  yPos = 55;

  // Job Title and Date
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(jobTitle, 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${exportDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, yPos);
  yPos += 15;

  // Executive Summary
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(result.executive_summary, pageWidth - 28);
  doc.text(summaryLines, 14, yPos);
  yPos += summaryLines.length * 5 + 10;

  // AI Recommendation Box
  doc.setFillColor(253, 250, 240); // Cream background
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(1);
  doc.roundedRect(14, yPos, pageWidth - 28, 45, 3, 3, 'FD');

  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...goldColor);
  doc.text('AI RECOMMENDATION', 20, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text(`🏆 ${result.recommendation.top_choice}`, 20, yPos);
  
  const confidenceText = `Confidence: ${result.recommendation.confidence.toUpperCase()}`;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(confidenceText, pageWidth - 14 - doc.getTextWidth(confidenceText), yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const justificationLines = doc.splitTextToSize(result.recommendation.justification, pageWidth - 40);
  doc.text(justificationLines.slice(0, 3), 20, yPos);
  yPos += 35;

  // Candidate Rankings Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Candidate Rankings', 14, yPos);
  yPos += 5;

  const rankingsData = result.rankings.map((r) => [
    `#${r.rank}`,
    r.candidate_name,
    `${r.score}/100`,
    r.key_differentiator.substring(0, 60) + (r.key_differentiator.length > 60 ? '...' : '')
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Rank', 'Candidate', 'Score', 'Key Differentiator']],
    body: rankingsData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
    styles: {
      fontSize: 9,
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Detailed Comparison Matrix
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Detailed Comparison Matrix', 14, yPos);
  yPos += 5;

  const matrixHeaders = ['Criterion', ...result.rankings.map(r => r.candidate_name)];
  const matrixData = result.comparison_matrix.map((row) => {
    const rowData = [row.criterion];
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
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // Risk Assessment
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Risk Assessment', 14, yPos);
  yPos += 5;

  const risksData = result.risks.map((risk) => [
    risk.candidate_name,
    risk.risks.length > 0 ? risk.risks.join('\n• ') : 'No significant risks identified'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Candidate', 'Identified Risks']],
    body: risksData,
    theme: 'striped',
    headStyles: {
      fillColor: [245, 158, 11], // Warning yellow
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  });

  // Alternative Recommendation (if exists)
  if (result.recommendation.alternative) {
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(`Alternative Option: ${result.recommendation.alternative}`, 14, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (result.recommendation.alternative_justification) {
      const altLines = doc.splitTextToSize(result.recommendation.alternative_justification, pageWidth - 28);
      doc.text(altLines, 14, yPos);
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Young Recruitment - Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `candidate-comparison-${jobTitle.toLowerCase().replace(/\s+/g, '-')}-${exportDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
