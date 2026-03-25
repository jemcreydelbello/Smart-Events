// ================================================================================
// PDF EXPORT MODAL - Event Sheet PDF Report Generator
// ================================================================================

/**
 * Open the PDF Export Modal
 */
function openPdfExportModal() {
  const modal = document.getElementById('pdfExportModal');
  if (modal) {
    modal.classList.add('active');
  }
}

/**
 * Close the PDF Export Modal
 */
function closePdfExportModal() {
  const modal = document.getElementById('pdfExportModal');
  if (modal) {
    modal.classList.remove('active');
  }
  // Reset checkboxes
  resetPdfExportCheckboxes();
}

/**
 * Reset all checkboxes to unchecked
 */
function resetPdfExportCheckboxes() {
  const checkboxes = document.querySelectorAll('.pdf-export-table-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  updateSelectAllCheckbox();
}

/**
 * Select All Tables
 */
function selectAllTables() {
  const checkboxes = document.querySelectorAll('.pdf-export-table-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  updateSelectAllCheckbox();
}

/**
 * Clear All Tables
 */
function clearAllTables() {
  const checkboxes = document.querySelectorAll('.pdf-export-table-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  updateSelectAllCheckbox();
}

/**
 * Update Select All checkbox state
 */
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('selectAllTablesCheckbox');
  const checkboxes = document.querySelectorAll('.pdf-export-table-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  const someChecked = Array.from(checkboxes).some(cb => cb.checked);
  
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = someChecked && !allChecked;
  }
}

/**
 * Handle Select All checkbox toggle
 */
function handleSelectAllToggle() {
  const selectAllCheckbox = document.getElementById('selectAllTablesCheckbox');
  if (selectAllCheckbox && selectAllCheckbox.checked) {
    selectAllTables();
  } else {
    clearAllTables();
  }
}

/**
 * Handle individual table checkbox change
 */
function handleTableCheckboxChange() {
  updateSelectAllCheckbox();
}

/**
 * Export PDF with selected tables
 */
function exportEventSheetPdf() {
  // Get event ID
  const eventId = window.currentEventId;
  if (!eventId) {
    showToast('Error: No event selected', 'error');
    return;
  }

  // Get selected tables
  const selectedTables = Array.from(document.querySelectorAll('.pdf-export-table-checkbox:checked'))
    .map(checkbox => checkbox.value);

  if (selectedTables.length === 0) {
    showToast('Please select at least one table to export', 'warning');
    return;
  }

  // Show loading state
  const exportBtn = document.getElementById('exportPdfBtn');
  const originalText = exportBtn.textContent;
  exportBtn.disabled = true;
  exportBtn.textContent = 'Generating PDF...';

  // Fetch event name from API (like postmortem does)
  const headers = getUserHeaders ? getUserHeaders() : {
    'Content-Type': 'application/json'
  };
  
  fetch(`../api/events.php?action=detail&event_id=${eventId}`, { headers })
    .then(response => response.json())
    .then(data => {
      let eventName = 'Event';
      
      // Get event name from API response
      if (data.success && data.data) {
        eventName = data.data.event_name || data.data.title || eventName;
        console.log('✅ Event name fetched from API:', eventName);
      } else {
        console.warn('⚠️ Failed to fetch event name from API, using fallback methods');
        
        // Fallback: try to get from DOM selectedEventInfo
        const selectedEventInfo = document.getElementById('selectedEventInfo');
        if (selectedEventInfo) {
          const strongTag = selectedEventInfo.querySelector('strong');
          if (strongTag && strongTag.textContent) {
            eventName = strongTag.textContent.trim();
            console.log('✅ Using event name from DOM selectedEventInfo:', eventName);
          }
        }
        
        // Fallback: Extract from all text nodes in selectedEventInfo
        if (eventName === 'Event' && selectedEventInfo && selectedEventInfo.textContent) {
          const text = selectedEventInfo.textContent.trim();
          const match = text.match(/^([^-]+)\s*-/);
          if (match && match[1]) {
            eventName = match[1].trim();
            console.log('✅ Using event name extracted from DOM text:', eventName);
          }
        }
        
        // Final fallback
        if (eventName === 'Event' && window.currentEventName) {
          eventName = window.currentEventName;
          console.log('✅ Using event name from currentEventName:', eventName);
        }
      }
      
      console.log('📄 Final event name for PDF:', eventName);
      
      // Now proceed with PDF generation
      generateEventSheetPdf(eventId, selectedTables, eventName, exportBtn, originalText);
    })
    .catch(error => {
      console.error('❌ Error fetching event name:', error);
      showToast('Error fetching event details', 'error');
      exportBtn.disabled = false;
      exportBtn.textContent = originalText;
    });
}

/**
 * Generate the PDF with event data
 */
function generateEventSheetPdf(eventId, selectedTables, eventName, exportBtn, originalText) {
  // Build PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 14;
  let isFirstSection = true;

  // Prepare tables data
  const tablesData = {};

  // Fetch data for each selected table
  Promise.all(selectedTables.map(table => {
    return new Promise((resolve) => {
      switch(table) {
        case 'attendees':
          fetchAttendeesData(eventId).then(data => {
            tablesData[table] = data;
            resolve();
          }).catch(() => resolve());
          break;
        case 'tasks':
          fetchTasksData(eventId).then(data => {
            tablesData[table] = data;
            resolve();
          }).catch(() => resolve());
          break;
        case 'program':
          // When program is selected, fetch both timeline and program flow data
          Promise.all([
            fetchTimelineData(eventId),
            fetchProgramData(eventId)
          ]).then(([timelineData, programData]) => {
            tablesData[table] = {
              timeline: timelineData,
              program: programData
            };
            resolve();
          }).catch(() => resolve());
          break;
        case 'timeline':
          fetchTimelineData(eventId).then(data => {
            tablesData[table] = data;
            resolve();
          }).catch(() => resolve());
          break;
        case 'logistics':
          fetchLogisticsData(eventId).then(data => {
            tablesData[table] = data;
            resolve();
          }).catch(() => resolve());
          break;
        case 'finance':
          fetchFinanceData(eventId).then(data => {
            tablesData[table] = data;
            resolve();
          }).catch(() => resolve());
          break;
        case 'automated-report':
          fetchAutomatedReportData(eventId).then(data => {
            tablesData[table] = data;
            resolve();
          }).catch(() => resolve());
          break;
        case 'log-reports':
          fetchLogReportsData(eventId).then(data => {
            tablesData[table] = data;
            resolve();
          }).catch(() => resolve());
          break;
        default:
          resolve();
      }
    });
  })).then(() => {
    // Add tables to PDF
    selectedTables.forEach((table, index) => {
      const data = tablesData[table];
      
      // Add a new page for each table (except the first one)
      if (index > 0) {
        doc.addPage();
        yPosition = 14;
        isFirstSection = true;
      }
      // Check if we need a new page (for content that doesn't fit on current page)
      else if (yPosition > 240) {
        doc.addPage();
        yPosition = 14;
        isFirstSection = true;
      }

      // Special handling for attendees table
      if (table === 'attendees' && data && data.rows && data.rows.length > 0) {
        yPosition = addAttendeesSectionToReport(doc, data, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
      }
      // Special handling for tasks table
      else if (table === 'tasks' && data && data.rows && data.rows.length > 0) {
        yPosition = addTasksSectionToReport(doc, data, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
      }
      // Special handling for program table (includes both timeline and program flow)
      else if (table === 'program' && data) {
        // Add timeline first if available
        if (data.timeline && data.timeline.rows && data.timeline.rows.length > 0) {
          yPosition = addTimelineSectionToReport(doc, data.timeline, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
          isFirstSection = false;
        }
        
        // Add program flow on its own page
        if (data.program && data.program.rows && data.program.rows.length > 0) {
          // Always add a new page for program flow section
          doc.addPage();
          yPosition = 14;
          isFirstSection = true;
          
          yPosition = addProgramSectionToReport(doc, data.program, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
          isFirstSection = false;
        }
      }
      // Special handling for timeline table
      else if (table === 'timeline' && data && data.rows && data.rows.length > 0) {
        yPosition = addTimelineSectionToReport(doc, data, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
      }
      // Special handling for logistics table
      else if (table === 'logistics' && data && data.rows && data.rows.length > 0) {
        yPosition = addLogisticsSectionToReport(doc, data, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
      }
      // Special handling for finance table
      else if (table === 'finance' && data && data.rows && data.rows.length > 0) {
        yPosition = addFinanceSectionToReport(doc, data, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
      }
      // Special handling for automated report (Postmortem)
      else if (table === 'automated-report' && data) {
        yPosition = addPostmortemReportSectionToReport(doc, data, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
      }
      // Special handling for log reports
      else if (table === 'log-reports' && data && data.reports && data.reports.length > 0) {
        yPosition = addLogReportsSectionToReport(doc, data, eventName, yPosition, isFirstSection, pageWidth, pageHeight);
      }
      // Standard table handling for other sections
      else {
        // Add section spacing
        if (!isFirstSection) {
          yPosition += 10;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(getTableLabel(table), 14, yPosition);
        
        yPosition += 8;

        // Add table using autoTable plugin
        if (data && data.columns && data.rows && data.rows.length > 0) {
          doc.autoTable({
            columns: data.columns,
            body: data.rows,
            startY: yPosition,
            margin: 14,
            theme: 'grid',
            headStyles: {
              fillColor: [30, 115, 187],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 10,
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 9,
              textColor: 50
            },
            alternateRowStyles: {
              fillColor: [245, 247, 250]
            }
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        } else {
          doc.setFontSize(10);
          doc.setFont(undefined, 'italic');
          doc.text('No data available', 14, yPosition);
          yPosition += 8;
        }
      }
      
      isFirstSection = false;
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(30, 115, 187);
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont(undefined, 'normal');
      doc.text('Intellismart Event Management System', 14, pageHeight - 10);
      
      // Page number
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      
      // Copyright
      doc.setFontSize(7);
      doc.text(`© ${new Date().getFullYear()} Intellismart. All rights reserved.`, 14, pageHeight - 5);
    }

    // Determine report type name based on selected tables
    const reportTypeNames = selectedTables.map(table => {
      const tableLabels = {
        'attendees': 'Attendees',
        'tasks': 'Tasks',
        'program': 'Program',
        'timeline': 'Timeline',
        'logistics': 'Logistics',
        'finance': 'Finance',
        'automated-report': 'Postmortem Reports',
        'log-reports': 'Logs Report'
      };
      return tableLabels[table] || table;
    });
    const reportType = reportTypeNames.length > 0 ? reportTypeNames.join(' & ') : 'Event Report';
    
    // Save PDF with proper filename format
    // Check if reportType already ends with "Report" or "Reports" to avoid duplication
    const reportTypeEndsWithReport = reportType.endsWith('Report') || reportType.endsWith('Reports');
    const fileName = reportTypeEndsWithReport ? 
      `${eventName} - ${reportType}.pdf` : 
      `${eventName} - ${reportType} Report.pdf`;
    doc.save(fileName);

    // Reset button
    exportBtn.disabled = false;
    exportBtn.textContent = originalText;

    // Close modal and show success message
    closePdfExportModal();
    showToast('Event report exported to PDF successfully!', 'success');
  }).catch(error => {
    console.error('Error generating PDF:', error);
    exportBtn.disabled = false;
    exportBtn.textContent = originalText;
    showToast('Error generating PDF', 'error');
  });
}

/**
 * Get readable label for table
 */
function getTableLabel(table) {
  const labels = {
    'attendees': 'Attendees',
    'tasks': 'Tasks',
    'program': 'Program',
    'logistics': 'Logistics',
    'finance': 'Finance',
    'automated-report': 'Postmortem Report',
    'log-reports': 'Log Reports'
  };
  return labels[table] || table;
}

/**
 * Add professional attendees section to PDF report
 */
function addAttendeesSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  // For first section, start header at top of page
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
  doc.text('EVENT ATTENDEES REPORT', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Professional Attendee Management & Documentation', 70, yPos + 35);
  
  // Event name and Generated date (same line, same styling)
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.setTextColor(255, 255, 255);
  doc.setTextColor(255, 255, 255);
  doc.text(`Event: ${eventName} | Generated: ${generatedDate}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== SUMMARY SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('REPORT SUMMARY', 14, yPos);
  
  yPos += 8;
  
  // Calculate counts
  const initialCount = (data.rawData || []).filter(a => (a.status || '').toUpperCase() !== 'ATTENDED').length;
  const attendedCount = (data.rawData || []).filter(a => (a.status || '').toUpperCase() === 'ATTENDED').length;
  const totalCount = (data.rawData || []).length;
  
  // Summary boxes styling
  const boxWidth = 45;
  const boxHeight = 16;
  const boxGap = 6;
  const baseX = 14;
  
  // Box 1: Initial List
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(baseX, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('INITIAL LIST', baseX + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(initialCount), baseX + 3, yPos + 12);
  
  // Box 2: Attended
  doc.setFillColor(230, 250, 240);
  doc.setDrawColor(16, 185, 129);
  doc.rect(baseX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('ATTENDED', baseX + boxWidth + boxGap + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(attendedCount), baseX + boxWidth + boxGap + 3, yPos + 12);
  
  // Box 3: Total
  doc.setFillColor(250, 245, 230);
  doc.setDrawColor(237, 128, 40);
  doc.rect(baseX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(237, 128, 40);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL', baseX + (boxWidth + boxGap) * 2 + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(totalCount), baseX + (boxWidth + boxGap) * 2 + 3, yPos + 12);
  
  yPos += 22;
  
  // ========== ATTENDEES TABLE ==========
  const columns = [
    { header: 'No.', dataKey: 'no', halign: 'center' },
    { header: 'Full Name', dataKey: 'full_name' },
    { header: 'Company', dataKey: 'company' },
    { header: 'Job Title', dataKey: 'job_title' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Phone', dataKey: 'phone' },
    { header: 'Status', dataKey: 'status', halign: 'center' }
  ];
  
  const rows = data.rows.map((row, idx) => ({
    no: idx + 1,
    full_name: row.full_name,
    company: row.company,
    job_title: row.job_title,
    email: row.email,
    phone: row.phone,
    status: row.status
  }));
  
  doc.autoTable({
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: rows.map(r => [r.no, r.full_name, r.company, r.job_title, r.email, r.phone, r.status]),
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [180, 190, 200],
      lineWidth: 0.3,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187]
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      6: { halign: 'center', cellWidth: 18 }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Add professional tasks section to PDF report
 */
function addTasksSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  // For first section, start header at top of page
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
  doc.text('EVENT TASKS REPORT', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Task Management & Project Tracking', 70, yPos + 35);
  
  // Event name and Generated date (same line, same styling)
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate2 = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.setTextColor(255, 255, 255);
  doc.text(`Event: ${eventName} | Generated: ${generatedDate2}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== SUMMARY SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('REPORT SUMMARY', 14, yPos);
  
  yPos += 8;
  
  // Calculate task counts by status from database values
  const rawTasks = data.rawData || data.rows || [];
  const totalTasks = rawTasks.length;
  const completedTasks = rawTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
  const inProgressTasks = rawTasks.filter(t => (t.status || '').toLowerCase() === 'in progress').length;
  const pendingTasks = rawTasks.filter(t => (t.status || '').toLowerCase() === 'pending').length;
  
  // Summary boxes styling
  const boxWidth = 45;
  const boxHeight = 16;
  const boxGap = 6;
  const baseX = 14;
  
  // Box 1: Total Tasks
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(baseX, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL TASKS', baseX + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(totalTasks), baseX + 3, yPos + 12);
  
  // Box 2: Completed
  doc.setFillColor(230, 250, 240);
  doc.setDrawColor(16, 185, 129);
  doc.rect(baseX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('COMPLETED', baseX + boxWidth + boxGap + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(completedTasks), baseX + boxWidth + boxGap + 3, yPos + 12);
  
  // Box 3: In Progress / Pending (combined as "Active")
  doc.setFillColor(250, 245, 230);
  doc.setDrawColor(237, 128, 40);
  doc.rect(baseX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(237, 128, 40);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('ACTIVE', baseX + (boxWidth + boxGap) * 2 + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(inProgressTasks + pendingTasks), baseX + (boxWidth + boxGap) * 2 + 3, yPos + 12);
  
  yPos += 22;
  
  // ========== TASKS TABLE ==========
  const columns = [
    { header: 'No.', dataKey: 'no', halign: 'center' },
    { header: 'Task Name', dataKey: 'task_name' },
    { header: 'Party Responsible', dataKey: 'party_responsible' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Due Date', dataKey: 'due_date' },
    { header: 'Remarks', dataKey: 'remarks' }
  ];
  
  const rows = data.rows.map((row, idx) => ({
    no: idx + 1,
    task_name: row.task_name,
    party_responsible: row.party_responsible,
    status: row.status,
    due_date: row.due_date,
    remarks: row.remarks
  }));
  
  doc.autoTable({
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: rows.map(r => [r.no, r.task_name, r.party_responsible, r.status, r.due_date, r.remarks]),
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [180, 190, 200],
      lineWidth: 0.3,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187]
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      3: { halign: 'center' },
      4: { halign: 'center' }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Add professional program section to PDF report
 */
function addProgramSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  // For first section, start header at top of page
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
  doc.text('EVENT PROGRAM FLOW', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Schedule & Session Management', 70, yPos + 35);
  
  // Event name and Generated date (same line, same styling)
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate3 = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.setTextColor(255, 255, 255);
  doc.text(`Event: ${eventName} | Generated: ${generatedDate3}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== SUMMARY SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('REPORT SUMMARY', 14, yPos);
  
  yPos += 8;
  
  // Calculate program statistics
  const rawProgram = data.rawData || data.rows || [];
  const totalItems = rawProgram.length;
  
  // Count speakers (non-empty speaker field)
  const speakersCount = rawProgram.filter(p => p.speaker && p.speaker !== '-').length;
  
  // Count unique locations
  const locations = new Set(rawProgram.map(p => p.location).filter(l => l && l !== '-'));
  const locationsCount = locations.size;
  
  // Summary boxes styling
  const boxWidth = 45;
  const boxHeight = 16;
  const boxGap = 6;
  const baseX = 14;
  
  // Box 1: Total Items
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(baseX, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL ITEMS', baseX + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(totalItems), baseX + 3, yPos + 12);
  
  // Box 2: Speakers
  doc.setFillColor(230, 250, 240);
  doc.setDrawColor(16, 185, 129);
  doc.rect(baseX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('SPEAKERS', baseX + boxWidth + boxGap + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(speakersCount), baseX + boxWidth + boxGap + 3, yPos + 12);
  
  // Box 3: Locations
  doc.setFillColor(250, 245, 230);
  doc.setDrawColor(237, 128, 40);
  doc.rect(baseX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(237, 128, 40);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('LOCATIONS', baseX + (boxWidth + boxGap) * 2 + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(locationsCount), baseX + (boxWidth + boxGap) * 2 + 3, yPos + 12);
  
  yPos += 22;
  
  // ========== PROGRAM TABLE ==========
  const columns = [
    { header: 'No.', dataKey: 'no', halign: 'center' },
    { header: 'Time', dataKey: 'time' },
    { header: 'Activity', dataKey: 'activity' },
    { header: 'Location', dataKey: 'location' },
    { header: 'Speaker', dataKey: 'speaker' }
  ];
  
  const rows = data.rows.map((row, idx) => ({
    no: idx + 1,
    time: row.time,
    activity: row.activity,
    location: row.location,
    speaker: row.speaker
  }));
  
  doc.autoTable({
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: rows.map(r => [r.no, r.time, r.activity, r.location, r.speaker]),
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [180, 190, 200],
      lineWidth: 0.3,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187]
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 18 }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Add professional timeline section to PDF report
 */
function addTimelineSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  // For first section, start header at top of page
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
  doc.text('EVENT TIMELINE', 70, yPos + 28);
  
  // Description under timeline title
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Project Schedule & Milestones', 70, yPos + 35);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  // Event name and Generated date (same line, same styling)
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate4 = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.setTextColor(255, 255, 255);
  doc.text(`Event: ${eventName} | Generated: ${generatedDate4}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== SUMMARY SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('REPORT SUMMARY', 14, yPos);
  
  yPos += 8;
  
  // Calculate timeline statistics
  const rawTimeline = data.rawData || data.rows || [];
  const totalItems = rawTimeline.length;
  
  // Summary boxes styling
  const boxWidth = 60;
  const boxHeight = 16;
  const boxGap = 6;
  const baseX = 14;
  
  // Box 1: Total Timeline Items
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(baseX, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL MILESTONES', baseX + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(totalItems), baseX + 3, yPos + 12);
  
  // Box 2: Timeline Coverage
  doc.setFillColor(230, 250, 240);
  doc.setDrawColor(16, 185, 129);
  doc.rect(baseX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('PROJECT PHASES', baseX + boxWidth + boxGap + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(totalItems), baseX + boxWidth + boxGap + 3, yPos + 12);
  
  yPos += 22;
  
  // ========== TIMELINE TABLE ==========
  const columns = [
    { header: 'No.', dataKey: 'no', halign: 'center' },
    { header: 'Week', dataKey: 'week' },
    { header: 'Title', dataKey: 'title' },
    { header: 'Description', dataKey: 'description' }
  ];
  
  const rows = data.rows.map((row, idx) => ({
    no: idx + 1,
    week: row.week,
    title: row.title,
    description: row.description
  }));
  
  doc.autoTable({
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: rows.map(r => [r.no, r.week, r.title, r.description]),
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [180, 190, 200],
      lineWidth: 0.3,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187]
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 20 }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Add professional finance section to PDF report
 */
function addFinanceSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  // For first section, start header at top of page
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
  doc.text('EVENT FINANCE', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Budget & Expense Management', 70, yPos + 35);
  
  // Event name and Generated date (same line, same styling)
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate6 = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.setTextColor(255, 255, 255);
  doc.text(`Event: ${eventName} | Generated: ${generatedDate6}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== KPI SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('FINANCIAL SUMMARY', 14, yPos);
  
  yPos += 8;
  
  // Calculate finance statistics from data
  const budget = parseFloat(data.budget) || 0;
  const totalExpenses = parseFloat(data.total_expenses) || 0;
  const balance = budget - totalExpenses;
  const itemCount = data.rows ? data.rows.length : 0;
  
  // KPI boxes styling
  const kpiBoxWidth = 45;
  const kpiBoxHeight = 20;
  const kpiBoxGap = 6;
  const kpiBaseX = 14;
  
  // Box 1: Budget
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(kpiBaseX, yPos, kpiBoxWidth, kpiBoxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('BUDGET', kpiBaseX + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`P ${budget.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, kpiBaseX + 3, yPos + 15);
  
  // Box 2: Total Expenses
  doc.setFillColor(250, 245, 230);
  doc.setDrawColor(237, 128, 40);
  doc.rect(kpiBaseX + kpiBoxWidth + kpiBoxGap, yPos, kpiBoxWidth, kpiBoxHeight, 'FD');
  doc.setTextColor(237, 128, 40);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL EXPENSES', kpiBaseX + kpiBoxWidth + kpiBoxGap + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`P ${totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, kpiBaseX + kpiBoxWidth + kpiBoxGap + 3, yPos + 15);
  
  // Box 3: Balance (Color changes based on over/under budget)
  const balanceIsNegative = balance < 0;
  
  if (balanceIsNegative) {
    doc.setFillColor(255, 230, 230);
    doc.setDrawColor(220, 38, 38);
  } else {
    doc.setFillColor(230, 250, 240);
    doc.setDrawColor(16, 185, 129);
  }
  
  doc.rect(kpiBaseX + (kpiBoxWidth + kpiBoxGap) * 2, yPos, kpiBoxWidth, kpiBoxHeight, 'FD');
  doc.setTextColor(balanceIsNegative ? 220 : 16, balanceIsNegative ? 38 : 185, balanceIsNegative ? 38 : 129);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('BALANCE', kpiBaseX + (kpiBoxWidth + kpiBoxGap) * 2 + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  const balanceStr = balanceIsNegative ? 
    `-P ${Math.abs(balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` :
    `P ${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  doc.text(balanceStr, kpiBaseX + (kpiBoxWidth + kpiBoxGap) * 2 + 3, yPos + 15);
  
  yPos += 27;
  
  // Generation timestamp
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Generated: ${dateStr} at ${timeStr}`, 14, yPos);
  
  yPos += 5;
  
  // ========== EXPENSES TABLE ==========
  const columns = [
    { header: 'No.', dataKey: 'no', halign: 'center' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Qty', dataKey: 'quantity' },
    { header: 'Unit Price', dataKey: 'unit_price' },
    { header: 'Total', dataKey: 'total' }
  ];
  
  const rows = data.rows.map((row, idx) => ({
    no: idx + 1,
    description: row.description,
    quantity: row.quantity,
    unit_price: `P ${parseFloat(row.unit_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
    total: `P ${(parseFloat(row.quantity) * parseFloat(row.unit_price)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
  }));
  
  doc.autoTable({
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: rows.map(r => [r.no, r.description, r.quantity, r.unit_price, r.total]),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.4,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187],
      fontSize: 10
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 8
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Fetch attendees data for the event
 */
async function fetchAttendeesData(eventId) {
  try {
    // First try to get data from global window.currentEventAttendees if available
    if (window.currentEventAttendees && window.currentEventAttendees.all && window.currentEventAttendees.all.length > 0) {
      const attendees = window.currentEventAttendees.all;
      console.log('✓ Using cached attendees data:', attendees.length);
      
      return {
        columns: [
          { header: 'Full Name', dataKey: 'full_name' },
          { header: 'Company', dataKey: 'company' },
          { header: 'Job Title', dataKey: 'job_title' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Phone', dataKey: 'phone' },
          { header: 'Status', dataKey: 'status' }
        ],
        rows: attendees.map(a => ({
          full_name: a.full_name || a.name || '-',
          company: a.company || '-',
          job_title: a.job_title || '-',
          email: a.email || '-',
          phone: a.phone || a.contact_number || '-',
          status: (a.status || '').toUpperCase() === 'ATTENDED' ? 'ATTENDED' : 'REGISTERED'
        })),
        rawData: attendees
      };
    }

    // Fallback to API if cached data not available
    const response = await fetch(`../api/participants.php?action=list&event_id=${eventId}`, {
      headers: getUserHeaders()
    });
    
    if (!response.ok) {
      console.error('Failed to fetch attendees from API');
      return { columns: [], rows: [] };
    }
    
    const data = await response.json();
    const attendeeList = Array.isArray(data) ? data : (data.data || []);
    
    console.log('✓ Fetched attendees from API:', attendeeList.length);

    return {
      columns: [
        { header: 'Full Name', dataKey: 'full_name' },
        { header: 'Company', dataKey: 'company' },
        { header: 'Job Title', dataKey: 'job_title' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Phone', dataKey: 'phone' },
        { header: 'Status', dataKey: 'status' }
      ],
      rows: attendeeList.map(a => ({
        full_name: a.full_name || a.name || '-',
        company: a.company || '-',
        job_title: a.job_title || '-',
        email: a.email || '-',
        phone: a.phone || a.contact_number || '-',
        status: (a.status || '').toUpperCase() === 'ATTENDED' ? 'ATTENDED' : 'REGISTERED'
      })),
      rawData: attendeeList
    };
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Fetch tasks data for the event from database
 */
async function fetchTasksData(eventId) {
  try {
    // Fetch from API - fetches from event_tasks database table
    const response = await fetch(`../api/tasks.php?action=list&event_id=${eventId}`, {
      headers: getUserHeaders()
    });

    if (!response.ok) {
      console.error('Failed to fetch tasks from API');
      return { columns: [], rows: [] };
    }

    const data = await response.json();
    const tasksList = data.success ? (data.data || []) : (Array.isArray(data) ? data : []);

    if (tasksList.length === 0) {
      console.log('✓ No tasks found for event:', eventId);
      return {
        columns: [
          { header: 'No.', dataKey: 'no' },
          { header: 'Task Name', dataKey: 'task_name' },
          { header: 'Party Responsible', dataKey: 'party_responsible' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Due Date', dataKey: 'due_date' },
          { header: 'Remarks', dataKey: 'remarks' }
        ],
        rows: [],
        rawData: []
      };
    }

    console.log('✓ Fetched tasks from database:', tasksList.length);

    // Process tasks from event_tasks table
    const processedRows = tasksList.map(t => ({
      task_name: t.task_name || 'Untitled Task',
      party_responsible: t.party_responsible || '-',
      status: t.status || 'Pending',
      due_date: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-',
      remarks: t.remarks || '-'
    }));

    return {
      columns: [
        { header: 'No.', dataKey: 'no' },
        { header: 'Task Name', dataKey: 'task_name' },
        { header: 'Party Responsible', dataKey: 'party_responsible' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Due Date', dataKey: 'due_date' },
        { header: 'Remarks', dataKey: 'remarks' }
      ],
      rows: processedRows,
      rawData: tasksList
    };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Fetch program data for the event from database
 */
async function fetchProgramData(eventId) {
  try {
    // Fetch from API - fetches from event_program_flow database table
    const response = await fetch(`../api/program.php?action=list-flow&event_id=${eventId}`, {
      headers: getUserHeaders()
    });

    if (!response.ok) {
      console.error('Failed to fetch program from API');
      return { columns: [], rows: [] };
    }

    const data = await response.json();
    const programList = data.success ? (data.data || []) : (Array.isArray(data) ? data : []);

    if (programList.length === 0) {
      console.log('✓ No program items found for event:', eventId);
      return {
        columns: [
          { header: 'No.', dataKey: 'no' },
          { header: 'Time', dataKey: 'time' },
          { header: 'Activity', dataKey: 'activity' },
          { header: 'Location', dataKey: 'location' },
          { header: 'Speaker', dataKey: 'speaker' },
          { header: 'Duration (mins)', dataKey: 'duration_mins' }
        ],
        rows: [],
        rawData: []
      };
    }

    console.log('✓ Fetched program items from database:', programList.length);

    // Process program items from event_program_flow table
    const processedRows = programList.map(p => ({
      time: p.time || '-',
      activity: p.activity || 'Untitled Activity',
      location: p.location || '-',
      speaker: p.speaker || '-',
      duration_mins: p.duration_mins || '-'
    }));

    return {
      columns: [
        { header: 'No.', dataKey: 'no' },
        { header: 'Time', dataKey: 'time' },
        { header: 'Activity', dataKey: 'activity' },
        { header: 'Location', dataKey: 'location' },
        { header: 'Speaker', dataKey: 'speaker' },
        { header: 'Duration (mins)', dataKey: 'duration_mins' }
      ],
      rows: processedRows,
      rawData: programList
    };
  } catch (error) {
    console.error('Error fetching program:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Add professional logistics section to PDF report
 */
function addLogisticsSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
  // For first section, start header at top of page
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
  doc.text('EVENT LOGISTICS', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Resource Planning & Inventory Management', 70, yPos + 35);
  
  // Event name and Generated date (same line, same styling)
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate5 = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.setTextColor(255, 255, 255);
  doc.text(`Event: ${eventName} | Generated: ${generatedDate5}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== SUMMARY SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('REPORT SUMMARY', 14, yPos);
  
  yPos += 8;
  
  // Calculate logistics statistics
  const rawLogistics = data.rawData || data.rows || [];
  const totalItems = rawLogistics.length;
  
  // Count items by status - completed includes both 'completed' and 'delivered'
  const completedCount = rawLogistics.filter(l => l.status && (l.status.toLowerCase() === 'completed' || l.status.toLowerCase() === 'delivered')).length;
  const pendingCount = rawLogistics.filter(l => l.status && (l.status.toLowerCase() === 'pending' || l.status.toLowerCase() === 'in progress')).length;
  
  // Summary boxes styling
  const boxWidth = 45;
  const boxHeight = 16;
  const boxGap = 6;
  const baseX = 14;
  
  // Box 1: Total Items
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(baseX, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL ITEMS', baseX + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(totalItems), baseX + 3, yPos + 12);
  
  // Box 2: Completed
  doc.setFillColor(230, 250, 240);
  doc.setDrawColor(16, 185, 129);
  doc.rect(baseX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('COMPLETED', baseX + boxWidth + boxGap + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(completedCount), baseX + boxWidth + boxGap + 3, yPos + 12);
  
  // Box 3: Pending
  doc.setFillColor(250, 245, 230);
  doc.setDrawColor(237, 128, 40);
  doc.rect(baseX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(237, 128, 40);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('PENDING', baseX + (boxWidth + boxGap) * 2 + 3, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(pendingCount), baseX + (boxWidth + boxGap) * 2 + 3, yPos + 12);
  
  yPos += 22;
  
  // ========== LOGISTICS TABLE ==========
  const columns = [
    { header: 'No.', dataKey: 'no', halign: 'center' },
    { header: 'Item', dataKey: 'item' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Partner', dataKey: 'partner' },
    { header: 'Status', dataKey: 'status' }
  ];
  
  const rows = data.rows.map((row, idx) => ({
    no: idx + 1,
    item: row.item,
    category: row.category,
    quantity: row.quantity,
    partner: row.partner,
    status: row.status
  }));
  
  doc.autoTable({
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: rows.map(r => [r.no, r.item, r.category, r.quantity, r.partner, r.status]),
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [180, 190, 200],
      lineWidth: 0.3,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187]
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 18 }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Fetch timeline data for the event
 */
async function fetchTimelineData(eventId) {
  try {
    // Fetch from API - fetches from event_timeline database table via program.php
    const response = await fetch(`../api/program.php?action=list-timeline&event_id=${eventId}`, {
      headers: getUserHeaders()
    });

    if (!response.ok) {
      console.error('Failed to fetch timeline from API');
      return { columns: [], rows: [] };
    }

    const data = await response.json();
    const timelineList = data.success ? (data.data || []) : (Array.isArray(data) ? data : []);

    if (timelineList.length === 0) {
      console.log('✓ No timeline items found for event:', eventId);
      return {
        columns: [
          { header: 'No.', dataKey: 'no' },
          { header: 'Week', dataKey: 'week' },
          { header: 'Title', dataKey: 'title' },
          { header: 'Description', dataKey: 'description' }
        ],
        rows: [],
        rawData: []
      };
    }

    console.log('✓ Fetched timeline items from database:', timelineList.length);

    // Process timeline items from event_timeline table
    const processedRows = timelineList.map(t => ({
      week: t.week_number ? `Week ${t.week_number}` : (t.month || '-'),
      title: t.title || 'Untitled Activity',
      description: t.description || '-'
    }));

    return {
      columns: [
        { header: 'No.', dataKey: 'no' },
        { header: 'Week', dataKey: 'week' },
        { header: 'Title', dataKey: 'title' },
        { header: 'Description', dataKey: 'description' }
      ],
      rows: processedRows,
      rawData: timelineList
    };
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Fetch logistics data for the event
 */
async function fetchLogisticsData(eventId) {
  try {
    // Fetch from API - fetches from event_logistics database table
    const response = await fetch(`../api/logistics.php?action=list&event_id=${eventId}`, {
      headers: getUserHeaders()
    });

    if (!response.ok) {
      console.error('Failed to fetch logistics from API');
      return { columns: [], rows: [] };
    }

    const data = await response.json();
    const logisticsList = data.success ? (data.data || []) : (Array.isArray(data) ? data : []);

    if (logisticsList.length === 0) {
      console.log('✓ No logistics items found for event:', eventId);
      return {
        columns: [
          { header: 'No.', dataKey: 'no' },
          { header: 'Item', dataKey: 'item' },
          { header: 'Category', dataKey: 'category' },
          { header: 'Quantity', dataKey: 'quantity' },
          { header: 'Partner', dataKey: 'partner' },
          { header: 'Status', dataKey: 'status' }
        ],
        rows: [],
        rawData: []
      };
    }

    console.log('✓ Fetched logistics items from database:', logisticsList.length);

    // Process logistics items from event_logistics table
    const processedRows = logisticsList.map(l => ({
      item: l.item || 'N/A',
      category: l.category || 'General',
      quantity: l.quantity || '0',
      partner: l.partner || '-',
      status: l.status || 'Pending'
    }));

    return {
      columns: [
        { header: 'No.', dataKey: 'no' },
        { header: 'Item', dataKey: 'item' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Quantity', dataKey: 'quantity' },
        { header: 'Partner', dataKey: 'partner' },
        { header: 'Status', dataKey: 'status' }
      ],
      rows: processedRows,
      rawData: logisticsList
    };
  } catch (error) {
    console.error('Error fetching logistics:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Fetch finance data for the event
 */
async function fetchFinanceData(eventId) {
  try {
    // Fetch from API - fetches from event_expenses database table with budget info
    const response = await fetch(`../api/finance.php?action=list&event_id=${eventId}`, {
      headers: getUserHeaders()
    });

    if (!response.ok) {
      console.error('Failed to fetch finance from API');
      return { columns: [], rows: [], budget: 0, total_expenses: 0 };
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Finance API returned error');
      return { columns: [], rows: [], budget: 0, total_expenses: 0 };
    }
    
    const expensesList = data.data || [];
    const budget = parseFloat(data.budget) || 0;
    const totalExpenses = parseFloat(data.grand_total) || 0;
    const balance = parseFloat(data.balance) || 0;

    if (expensesList.length === 0) {
      console.log('✓ No expenses found for event:', eventId);
      return {
        columns: [
          { header: 'No.', dataKey: 'no' },
          { header: 'Description', dataKey: 'description' },
          { header: 'Qty', dataKey: 'quantity' },
          { header: 'Unit Price', dataKey: 'unit_price' },
          { header: 'Total', dataKey: 'total' }
        ],
        rows: [],
        rawData: [],
        budget: budget,
        total_expenses: totalExpenses,
        balance: balance
      };
    }

    console.log('✓ Fetched expenses from database:', expensesList.length);

    // Process expenses from event_expenses table
    const processedRows = expensesList.map(e => ({
      description: e.description || 'N/A',
      quantity: e.quantity || 1,
      unit_price: parseFloat(e.unit_price) || 0,
      total: parseFloat(e.quantity || 1) * parseFloat(e.unit_price || 0)
    }));

    return {
      columns: [
        { header: 'No.', dataKey: 'no' },
        { header: 'Description', dataKey: 'description' },
        { header: 'Qty', dataKey: 'quantity' },
        { header: 'Unit Price', dataKey: 'unit_price' },
        { header: 'Total', dataKey: 'total' }
      ],
      rows: processedRows,
      rawData: expensesList,
      budget: budget,
      total_expenses: totalExpenses,
      balance: balance
    };
  } catch (error) {
    console.error('Error fetching finance:', error);
    return { columns: [], rows: [], budget: 0, total_expenses: 0 };
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

/**
 * Format date string to readable format
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Format time string to readable format
 */
function formatTime(timeString) {
  if (!timeString) return 'N/A';
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeString;
  }
}

/**
 * Format date and time string to readable format
 */
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return 'N/A';
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateTimeString;
  }
}

/**
 * Fetch Automated Report Data
 */
async function fetchAutomatedReportData(eventId) {
  try {
    const headers = getUserHeaders();
    
    // Fetch postmortem data, metrics, and finance info
    const [postmortemResponse, metricsResponse, financeResponse] = await Promise.all([
      fetch(`../api/postmortem.php?action=get&event_id=${eventId}`, { headers }),
      fetch(`../api/postmortem.php?action=calculate&event_id=${eventId}`, { headers }),
      fetch(`../api/finance.php?action=list&event_id=${eventId}`, { headers })
    ]);
    
    const postmortemData = await postmortemResponse.json();
    const metricsData = await metricsResponse.json();
    const financeData = await financeResponse.json();
    
    // Combine all responses
    const combined = {
      ...(postmortemData.success ? postmortemData.data : {}),
      ...((metricsData.success ? metricsData.data : {}) || {})
    };
    
    // Add budget and expenses from finance API
    if (financeData.success) {
      combined.total_budget = financeData.budget || 0;
      combined.budget_tracked = financeData.grand_total || 0;
    }
    
    console.log('✓ Combined postmortem data:', combined);
    return combined;
  } catch (error) {
    console.error('Error fetching postmortem data:', error);
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
/**
 * Add Postmortem Report Section to PDF (replaces automated report)
 */
function addPostmortemReportSectionToReport(doc, data, eventName, startY, isFirstSection, pageWidth, pageHeight) {
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
  doc.text('POSTMORTEM REPORTS', 70, yPos + 28);
  
  // Subheading
  doc.setTextColor(230, 240, 250);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Professional Analysis & Log Documentation', 70, yPos + 35);
  
  // Event name and Generated date (same line, same styling)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate7 = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.text(`Event: ${eventName} | Generated: ${generatedDate7}`, 70, yPos + 42);
  
  yPos += 65;
  
  // ========== REPORT SUMMARY HEADING ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('REPORT SUMMARY', 14, yPos);
  
  yPos += 8;
  
  // Extract numeric values - use correct field names from metrics
  const regCount = parseInt(data.total_registrations) || parseInt(data.registered_count) || 0;
  const attendedCount = parseInt(data.attended_count) || 0;
  const attendanceNum = parseFloat(data.attendance_rate) || 0;
  const taskCompNum = parseFloat(data.task_completion_rate) || 0;
  const logisticsNum = parseFloat(data.logistics_completion_rate) || 0;
  
  // ========== KPI BOXES (4 in a row) ==========
  const boxWidth = 40;
  const boxHeight = 16;
  const boxGap = 5;
  const baseX = 14;
  
  // Box 1: Registrations
  doc.setFillColor(230, 240, 250);
  doc.setDrawColor(30, 115, 187);
  doc.setLineWidth(0.5);
  doc.rect(baseX, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('REGISTRATIONS', baseX + 2, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(regCount), baseX + 2, yPos + 12);
  
  // Box 2: Attendance Rate
  doc.setFillColor(230, 250, 240);
  doc.setDrawColor(16, 185, 129);
  doc.rect(baseX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('ATTENDANCE RATE', baseX + boxWidth + boxGap + 2, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(attendanceNum.toFixed(1)) + '%', baseX + boxWidth + boxGap + 2, yPos + 12);
  
  // Box 3: Task Completion
  doc.setFillColor(250, 245, 230);
  doc.setDrawColor(237, 128, 40);
  doc.rect(baseX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(237, 128, 40);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('TASK COMPLETION', baseX + (boxWidth + boxGap) * 2 + 2, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(taskCompNum.toFixed(0)) + '%', baseX + (boxWidth + boxGap) * 2 + 2, yPos + 12);
  
  // Box 4: Logistics Completion
  doc.setFillColor(245, 235, 250);
  doc.setDrawColor(168, 85, 247);
  doc.rect(baseX + (boxWidth + boxGap) * 3, yPos, boxWidth, boxHeight, 'FD');
  doc.setTextColor(168, 85, 247);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('LOGISTICS', baseX + (boxWidth + boxGap) * 3 + 2, yPos + 5);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(String(logisticsNum.toFixed(0)) + '%', baseX + (boxWidth + boxGap) * 3 + 2, yPos + 12);
  
  yPos += 22;
  
  // Generation timestamp
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Generated: ${dateStr} at ${timeStr}`, 14, yPos);
  
  yPos += 8;
  
  // ========== EVENT DYNAMICS SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Event Dynamics', 14, yPos);
  
  yPos += 5;
  
  // Event Dynamics Table
  const initialAttendees = parseInt(data.initial_attendees) || 0;
  const actualAttendees = parseInt(data.actual_attendees) || 0;
  
  const dynTableData = [
    ['Initial Attendees', String(initialAttendees)],
    ['Actual Attendees', String(actualAttendees)]
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [['Metric', 'Count']],
    body: dynTableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [180, 190, 200],
      lineWidth: 0.3,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187]
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      1: { halign: 'center' }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 8;
  
  // ========== FINANCE SUMMARY SECTION ==========
  doc.setTextColor(30, 115, 187);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Finance Summary', 14, yPos);
  
  yPos += 5;
  
  // Finance data - use real values from finance API
  // The finance API returns 'budget' and 'grand_total'
  const budgetAmount = parseFloat(data.total_budget || data.budget) || 0;
  const expenseAmount = parseFloat(data.budget_tracked || data.grand_total) || 0;
  const balanceAmount = budgetAmount - expenseAmount;
  
  // Finance Summary Table
  const finTableData = [
    ['Budget', `P ${budgetAmount.toFixed(2)}`],
    ['Expense', `P ${expenseAmount.toFixed(2)}`],
    ['Balance', `P ${balanceAmount.toFixed(2)}`]
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [['Description', 'Amount']],
    body: finTableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [180, 190, 200],
      lineWidth: 0.3,
      font: 'helvetica',
      textColor: [40, 40, 40]
    },
    headStyles: {
      fillColor: [30, 115, 187],
      textColor: 255,
      fontStyle: 'bold',
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      lineColor: [30, 115, 187]
    },
    bodyStyles: {
      valign: 'middle',
      font: 'helvetica',
      minCellHeight: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      1: { halign: 'right' }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Add Log Reports Section to PDF
 */
/**
 * Helper function to render justified text with first-line indentation
 */
function renderJustifiedParagraphForModal(doc, text, startX, startY, maxWidth, lineHeight, pageWidth, pageHeight) {
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
      renderJustifiedLineForModal(doc, lineWords, xPos, yPos, availableWidth, isFirstLine, lineNumber);
      
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
function renderJustifiedLineForModal(doc, words, xPos, yPos, maxWidth, isFirstLine, lineNumber) {
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
  
  // Event name and Generated date (same line, same styling)
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const generatedDate8 = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  doc.setTextColor(255, 255, 255);
  doc.text(`Event: ${eventName} | Generated: ${generatedDate8}`, 70, yPos + 42);
  
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
    
    yPos += 6;
    
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
    
    let isFirstField = true;
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
        
        yPos = renderJustifiedParagraphForModal(doc, field.value, leftMargin, yPos, maxWidth, lineHeight, pageWidth, pageHeight);
        
        // Add extra spacing after first field (Summary)
        if (isFirstField) {
          yPos += 3;
          isFirstField = false;
        } else {
          yPos += 2;
        }
      }
    });
    
    yPos += 3;
  });
  
  return yPos + 10;
}
