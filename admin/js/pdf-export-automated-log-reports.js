/**
 * Helper function to render justified text with first-line indentation
 */
function renderJustifiedParagraph(doc, text, startX, startY, maxWidth, lineHeight, pageWidth, pageHeight) {
  const pageWidthValue = pageWidth;
  const pageHeightValue = pageHeight;
  let yPos = startY;
  const indentMM = 10; // indentation in mm (paragraph indent)
  
  // Split text into words
  const words = String(text).trim().split(/\s+/);
  if (words.length === 0) return yPos;
  
  let lineWords = [];
  let lineNumber = 0;
  
  for (let i = 0; i < words.length; i++) {
    lineWords.push(words[i]);
    
    // Calculate available width based on whether this is first line (indented)
    const isFirstLine = lineNumber === 0;
    const xOffset = isFirstLine ? indentMM : 0;
    const availableWidth = maxWidth - xOffset;
    
    // Test if adding next word would exceed width
    const testLine = lineWords.join(' ');
    const testWidth = doc.getTextWidth(testLine);
    
    if (testWidth > availableWidth && lineWords.length > 1) {
      // Line is full, render this line justified
      lineWords.pop(); // Remove last word
      i--; // Process it again in next iteration
      
      // Render justified line
      const xPos = startX + xOffset;
      renderJustifiedLine(doc, lineWords, xPos, yPos, availableWidth, isFirstLine, lineNumber);
      
      yPos += lineHeight;
      if (yPos > pageHeightValue - 30) {
        doc.addPage();
        yPos = 14;
        lineNumber = 0; // Reset line counting after page break
        lineWords = [];
        continue;
      }
      
      lineWords = [];
      lineNumber++;
    }
  }
  
  // Render remaining words (last line - left aligned, not justified)
  if (lineWords.length > 0) {
    const isFirstLine = lineNumber === 0;
    const xOffset = isFirstLine ? indentMM : 0;
    const xPos = startX + xOffset;
    const lineText = lineWords.join(' ');
    doc.text(lineText, xPos, yPos);
    yPos += lineHeight;
  }
  
  return yPos;
}

/**
 * Helper function to render a single justified line
 */
function renderJustifiedLine(doc, words, xPos, yPos, maxWidth, isFirstLine, lineNumber) {
  if (words.length === 0) return;
  if (words.length === 1) {
    // Single word, just render it
    doc.text(words[0], xPos, yPos);
    return;
  }
  
  // Calculate total width of all words
  const wordWidths = words.map(w => doc.getTextWidth(w));
  const totalWordWidth = wordWidths.reduce((a, b) => a + b, 0);
  
  // Calculate total space needed
  const totalSpaceNeeded = maxWidth - totalWordWidth;
  const gaps = words.length - 1;
  const spacePerGap = gaps > 0 ? totalSpaceNeeded / gaps : 0;
  
  // Render each word with calculated spacing
  let currentX = xPos;
  words.forEach((word, index) => {
    doc.text(word, currentX, yPos);
    if (index < words.length - 1) {
      currentX += wordWidths[index] + spacePerGap;
    }
  });
}


/**
 * Fetch Automated Report Data
 */
async function fetchAutomatedReportData(eventId) {
  try {
    const headers = getUserHeaders();
    
    // Fetch postmortem data
    const response = await fetch(`../api/postmortem.php?action=get&event_id=${eventId}`, {
      headers
    });
    
    if (!response.ok) {
      console.error('Failed to fetch automated report data');
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching automated report:', error);
    return null;
  }
}

/**
 * Fetch Log Reports Data
 */
async function fetchLogReportsData(eventId) {
  try {
    const headers = getUserHeaders();
    
    // Fetch list of log reports for the event
    const response = await fetch(`../api/postmortem.php?action=list_log_reports&event_id=${eventId}`, {
      headers
    });
    
    if (!response.ok) {
      console.error('Failed to fetch log reports');
      return { reports: [] };
    }
    
    const data = await response.json();
    const reports = data.success ? (data.data || []) : [];
    
    return {
      reports: reports,
      rawData: reports
    };
  } catch (error) {
    console.error('Error fetching log reports:', error);
    return { reports: [] };
  }
}

/**
 * Add Automated Report Section to PDF
 */
function addAutomatedReportSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  let yPos = isFirstSection ? 0 : startY;
  
  // Add blue header section with Intellismart branding
  doc.setFillColor(30, 115, 187);
  doc.rect(0, yPos, pageWidth, 50, 'F');
  
  // Add decorative accent bar
  doc.setFillColor(237, 128, 40);
  doc.rect(0, yPos + 48, pageWidth, 4, 'F');
  
  // Logo/Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Intellismart', 16, yPos + 15);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Event Management System', 16, yPos + 20);
  
  // Main heading
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('AUTOMATED REPORT', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Event Metrics & Postmortem Analysis', 70, yPos + 35);
  
  // Event name
  doc.setFontSize(9);
  doc.text(`Event: ${eventName}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== KEY METRICS SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('KEY METRICS', 14, yPos);
  
  yPos += 8;
  
  // Calculate metrics
  const initialAttendees = parseInt(data.initial_attendees) || 0;
  const actualAttendees = parseInt(data.actual_attendees) || 0;
  const attendanceRate = parseFloat(data.attendance_rate) || 0;
  const taskCompletion = parseFloat(data.task_completion_rate) || 0;
  const logisticsCompletion = parseFloat(data.logistics_completion_rate) || 0;
  
  // Metrics boxes styling
  const boxWidth = 30;
  const boxHeight = 18;
  const boxGap = 5;
  const baseX = 14;
  
  // Box 1: Initial
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(baseX, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('INITIAL', baseX + 2, yPos + 4);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(String(initialAttendees), baseX + 2, yPos + 13);
  
  // Box 2: Attended
  doc.setFillColor(230, 250, 240);
  doc.setDrawColor(16, 185, 129);
  doc.rect(baseX + (boxWidth + boxGap), yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('ATTENDED', baseX + (boxWidth + boxGap) + 2, yPos + 4);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(String(actualAttendees), baseX + (boxWidth + boxGap) + 2, yPos + 13);
  
  // Box 3: Attendance Rate
  doc.setFillColor(255, 240, 230);
  doc.setDrawColor(237, 128, 40);
  doc.rect(baseX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(237, 128, 40);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('ATT. RATE', baseX + (boxWidth + boxGap) * 2 + 2, yPos + 4);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(attendanceRate.toFixed(1) + '%', baseX + (boxWidth + boxGap) * 2 + 2, yPos + 13);
  
  // Box 4: Task Completion
  doc.setFillColor(240, 230, 250);
  doc.setDrawColor(139, 92, 246);
  doc.rect(baseX + (boxWidth + boxGap) * 3, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(139, 92, 246);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('TASK COMP.', baseX + (boxWidth + boxGap) * 3 + 2, yPos + 4);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(taskCompletion.toFixed(1) + '%', baseX + (boxWidth + boxGap) * 3 + 2, yPos + 13);
  
  // Box 5: Logistics Completion
  doc.setFillColor(250, 240, 230);
  doc.setDrawColor(217, 119, 6);
  doc.rect(baseX + (boxWidth + boxGap) * 4, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('LOG. COMP.', baseX + (boxWidth + boxGap) * 4 + 2, yPos + 4);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(logisticsCompletion.toFixed(1) + '%', baseX + (boxWidth + boxGap) * 4 + 2, yPos + 13);
  
  yPos += 25;
  
  // ========== SUMMARY SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('FEEDBACK & INSIGHTS', 14, yPos);
  
  yPos += 6;
  
  // Feedback summary
  if (data.feedback_summary) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    const feedbackText = String(data.feedback_summary);
    const splitFeedback = doc.splitTextToSize(feedbackText, pageWidth - 28);
    splitFeedback.forEach((line, idx) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 14;
      }
      doc.text(line, 14, yPos);
      yPos += 4;
    });
  }
  
  yPos += 5;
  
  // ========== LESSONS LEARNED ==========
  if (data.lessons_learned) {
    doc.setTextColor(30, 115, 187);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('LESSONS LEARNED', 14, yPos);
    
    yPos += 6;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    const lessonsText = String(data.lessons_learned);
    const splitLessons = doc.splitTextToSize(lessonsText, pageWidth - 28);
    splitLessons.forEach((line, idx) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 14;
      }
      doc.text(line, 14, yPos);
      yPos += 4;
    });
  }
  
  return yPos + 10;
}

/**
 * Add Log Reports Section to PDF
 */
function addLogReportsSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  let yPos = isFirstSection ? 0 : startY;
  
  // Add blue header section with Intellismart branding
  doc.setFillColor(30, 115, 187);
  doc.rect(0, yPos, pageWidth, 50, 'F');
  
  // Add decorative accent bar
  doc.setFillColor(237, 128, 40);
  doc.rect(0, yPos + 48, pageWidth, 4, 'F');
  
  // Logo/Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Intellismart', 16, yPos + 15);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Event Management System', 16, yPos + 20);
  
  // Main heading
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('LOG REPORTS', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Event Documentation & Activity Logs', 70, yPos + 35);
  
  // Event name
  doc.setFontSize(9);
  doc.text(`Event: ${eventName}`, 70, yPos + 42);
  
  yPos += 65;
  
  const reports = data.reports || [];
  
  if (reports.length === 0) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('No log reports have been created for this event.', 14, yPos);
    return yPos + 20;
  }
  
  // ========== EACH LOG REPORT ==========
  reports.forEach((report, reportIndex) => {
    // Add page break if needed
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 14;
    }
    
    // Report header
    doc.setTextColor(30, 115, 187);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const reportTitle = report.log_title_introduction ? `Report ${reportIndex + 1}: ${report.log_title_introduction}` : `Report ${reportIndex + 1}`;
    const titleLines = doc.splitTextToSize(reportTitle, pageWidth - 28);
    titleLines.forEach((line, idx) => {
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    
    yPos += 3;
    
    // Report details
    const reportFields = [
      { label: 'Summary', value: report.log_issue_summary },
      { label: 'Root Cause', value: report.log_root_cause_analysis },
      { label: 'Impact & Mitigation', value: report.log_impact_mitigation },
      { label: 'Resolution', value: report.log_resolution_recovery },
      { label: 'Corrective Measures', value: report.log_corrective_measures },
      { label: 'Feedback', value: report.log_feedback_survey },
      { label: 'Lessons Learned', value: report.log_lesson_learned }
    ];
    
    reportFields.forEach(field => {
      if (field.value && field.value.trim()) {
        // Label
        doc.setTextColor(30, 115, 187);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`${field.label}:`, 14, yPos);
        yPos += 4;
        
        // Value with justified text and first-line indentation
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8.5);
        doc.setFont(undefined, 'normal');
        const lineHeight = 3.5;
        const leftMargin = 18;
        const maxWidth = pageWidth - 28;
        
        yPos = renderJustifiedParagraph(doc, field.value, leftMargin, yPos, maxWidth, lineHeight, pageWidth, pageHeight);
        yPos += 2;
      }
    });
    
    yPos += 3;
  });
  
  return yPos + 10;
}
