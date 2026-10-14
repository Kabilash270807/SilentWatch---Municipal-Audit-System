import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditReport, Incident, DerivedMeasurement } from '../types';

export function downloadAuditReportPdf(report: AuditReport): void {
  const doc = new jsPDF();

  // Header Title & Civic Tech Branding
  doc.setFillColor(15, 23, 42); // Deep navy #0f172a
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SILENTWATCH MUNICIPAL AUDIT SYSTEM', 14, 14);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Community Noise Pollution Audit Report', 14, 22);
  doc.text(`Official Identifier: ${report.report_id}`, 140, 22);

  // Summary Metadata
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`Generated At: ${new Date(report.generated_at).toLocaleString()}`, 14, 40);
  doc.text(`Privacy Verification: ${report.privacy_verification_status}`, 14, 46);

  // Primary Audit Details Table
  autoTable(doc, {
    startY: 52,
    head: [['Audit Field', 'Observed Value / Municipal Finding']],
    body: [
      ['Report ID', report.report_id],
      ['Reporting Period', report.reporting_period],
      ['Zone Type', report.zone_type],
      ['Monitoring Grid', report.monitoring_grid],
      ['Average Noise Level', report.average_noise_level],
      ['Applicable Nighttime Limit', report.applicable_nighttime_limit],
      ['Recorded Exceedance', report.recorded_exceedance],
      ['Number of Valid Samples', String(report.number_of_valid_samples)],
      ['Detection Status', report.detection_status],
      ['Measurement Confidence', report.measurement_confidence],
      ['Recommended Action', report.recommended_action],
      ['Median Noise-Floor Estimate', report.median_noise_floor_estimate],
      ['Exceedance Percentage', `${report.exceedance_percentage}%`],
      ['Chronic Noise Score', `${report.chronic_noise_score} / 100`],
      ['Monitored Nights', String(report.monitored_nights)],
      ['Nights with Repeated Exceedances', String(report.nights_with_repeated_exceedance)],
      ['Calibration Status', report.calibration_status],
      ['Reference Instrument', report.reference_instrument || 'Acoustic standard comparison'],
      ['Measurement Uncertainty', report.measurement_uncertainty],
      ['Data Coverage', report.data_coverage],
      ['Regulatory Reference', report.regulatory_source],
      ['Processing Algorithm', report.algorithm_version]
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] }, // Navy blue accent
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Quality warnings and investigation remarks
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Technical Quality & Privacy Safeguards Statement:', 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    '1. Absolute Privacy Assurance: ZERO raw audio recordings or voiceprints have been collected or persisted.\n' +
    '2. Derived Measurements: Statistical figures are based on validated local DSP and explainable non-AI rules.\n' +
    '3. Legal Notice: This document represents preliminary screening evidence for municipal environmental investigation.\n' +
    '   Formal statutory enforcement requires on-site calibrated verification by certified officers.',
    14,
    finalY + 6
  );

  doc.save(`${report.report_id}-Community-Noise-Audit.pdf`);
}

export function exportCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJson(filename: string, data: any): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
