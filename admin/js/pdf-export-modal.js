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

  // Build PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const eventName = window.currentEventName || 'Event';
  let yPosition = 14;
  
  // Add title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Event Report - ' + eventName, 14, yPosition);
  
  yPosition += 10;
  
  // Add metadata
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPosition);
  
  yPosition += 8;

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
          fetchProgramData(eventId).then(data => {
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
        default:
          resolve();
      }
    });
  })).then(() => {
    // Add tables to PDF
    selectedTables.forEach((table, index) => {
      const data = tablesData[table];
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 14;
      }

      // Add table section title
      if (index > 0) {
        yPosition += 8;
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
            fillColor: [59, 130, 246],
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
    });

    // Save PDF
    const fileName = `Event_Report_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
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
    'finance': 'Finance'
  };
  return labels[table] || table;
}

// ================================================================================
// DATA FETCHING FUNCTIONS
// ================================================================================

/**
 * Fetch attendees data for the event
 */
async function fetchAttendeesData(eventId) {
  try {
    // First try to get data from DOM - this is the most reliable source
    const attendeeRows = document.querySelectorAll('#eventAttendeesTableBody tr');
    
    if (attendeeRows && attendeeRows.length > 0) {
      const attendees = Array.from(attendeeRows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          full_name: cells[0]?.textContent?.trim() || 'N/A',
          email: cells[1]?.textContent?.trim() || 'N/A',
          phone: cells[2]?.textContent?.trim() || 'N/A',
          status: cells[3]?.textContent?.trim() || 'N/A',
          check_in_time: cells[4]?.textContent?.trim() || 'Not checked in'
        };
      });

      return {
        columns: [
          { header: 'Name', dataKey: 'full_name' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Phone', dataKey: 'phone' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Check-in Time', dataKey: 'check_in_time' }
        ],
        rows: attendees
      };
    }

    // Fallback to API if DOM data not available
    const response = await fetch(`../api/attendance.php?event_id=${eventId}`, {
      headers: getUserHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch attendees');
    
    const data = await response.json();
    const attendeeList = Array.isArray(data) ? data : data.data || [];

    return {
      columns: [
        { header: 'Name', dataKey: 'full_name' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Phone', dataKey: 'phone' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Check-in Time', dataKey: 'check_in_time' }
      ],
      rows: attendeeList.map(a => ({
        full_name: a.full_name || a.name || 'N/A',
        email: a.email || 'N/A',
        phone: a.phone || 'N/A',
        status: a.status || 'N/A',
        check_in_time: a.check_in_time ? formatDateTime(a.check_in_time) : 'Not checked in'
      }))
    };
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Fetch tasks data for the event
 */
async function fetchTasksData(eventId) {
  try {
    // Extract from DOM - most reliable
    const taskRows = document.querySelectorAll('#eventTasksTableBody tr');
    
    if (taskRows && taskRows.length > 0) {
      const tasks = Array.from(taskRows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          task_name: cells[0]?.textContent?.trim() || 'N/A',
          assigned_to: cells[1]?.textContent?.trim() || 'Unassigned',
          status: cells[2]?.textContent?.trim() || 'Pending',
          due_date: cells[3]?.textContent?.trim() || 'N/A',
          priority: cells[4]?.textContent?.trim() || 'Normal'
        };
      });

      return {
        columns: [
          { header: 'Task', dataKey: 'task_name' },
          { header: 'Assigned To', dataKey: 'assigned_to' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Due Date', dataKey: 'due_date' },
          { header: 'Priority', dataKey: 'priority' }
        ],
        rows: tasks
      };
    }

    // Fallback to API
    const response = await fetch(`../api/tasks.php?event_id=${eventId}`, {
      headers: getUserHeaders()
    }).catch(() => null);

    let tasks = [];
    
    if (response && response.ok) {
      const data = await response.json();
      tasks = Array.isArray(data) ? data : data.data || [];
    }

    return {
      columns: [
        { header: 'Task', dataKey: 'task_name' },
        { header: 'Assigned To', dataKey: 'assigned_to' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Due Date', dataKey: 'due_date' },
        { header: 'Priority', dataKey: 'priority' }
      ],
      rows: tasks.map(t => ({
        task_name: t.task_name || t.title || 'N/A',
        assigned_to: t.assigned_to || t.coordinator_name || 'Unassigned',
        status: t.status || 'Pending',
        due_date: t.due_date ? formatDate(t.due_date) : 'N/A',
        priority: t.priority || 'Normal'
      }))
    };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Fetch program data for the event
 */
async function fetchProgramData(eventId) {
  try {
    // Try to get from DOM first
    const programRows = document.querySelectorAll('#programTableBody tr, #eventProgramTableBody tr');
    
    if (programRows && programRows.length > 0) {
      const program = Array.from(programRows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          name: cells[0]?.textContent?.trim() || 'N/A',
          time: cells[1]?.textContent?.trim() || 'N/A',
          speaker: cells[2]?.textContent?.trim() || 'N/A',
          location: cells[3]?.textContent?.trim() || 'N/A',
          duration: cells[4]?.textContent?.trim() || 'N/A'
        };
      });

      return {
        columns: [
          { header: 'Session/Activity', dataKey: 'name' },
          { header: 'Time', dataKey: 'time' },
          { header: 'Speaker/Host', dataKey: 'speaker' },
          { header: 'Location', dataKey: 'location' },
          { header: 'Duration', dataKey: 'duration' }
        ],
        rows: program
      };
    }

    // Fallback to API
    const response = await fetch(`../api/program.php?event_id=${eventId}`, {
      headers: getUserHeaders()
    }).catch(() => null);

    let program = [];
    
    if (response && response.ok) {
      const data = await response.json();
      program = Array.isArray(data) ? data : data.data || [];
    }

    return {
      columns: [
        { header: 'Session/Activity', dataKey: 'name' },
        { header: 'Time', dataKey: 'time' },
        { header: 'Speaker/Host', dataKey: 'speaker' },
        { header: 'Location', dataKey: 'location' },
        { header: 'Duration', dataKey: 'duration' }
      ],
      rows: program.map(p => ({
        name: p.name || p.title || 'N/A',
        time: p.time || p.start_time ? formatTime(p.time || p.start_time) : 'N/A',
        speaker: p.speaker || p.host_name || 'N/A',
        location: p.location || 'N/A',
        duration: p.duration || 'N/A'
      }))
    };
  } catch (error) {
    console.error('Error fetching program:', error);
    return { columns: [], rows: [] };
  }
}

/**
 * Fetch logistics data for the event
 */
async function fetchLogisticsData(eventId) {
  try {
    // Try to get from DOM first
    const logisticsRows = document.querySelectorAll('#logisticsTableBody tr, #eventLogisticsTableBody tr');
    
    if (logisticsRows && logisticsRows.length > 0) {
      const logistics = Array.from(logisticsRows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          item_name: cells[0]?.textContent?.trim() || 'N/A',
          category: cells[1]?.textContent?.trim() || 'General',
          quantity: cells[2]?.textContent?.trim() || '0',
          status: cells[3]?.textContent?.trim() || 'Pending',
          notes: (cells[4]?.textContent?.trim() || 'N/A').substring(0, 50)
        };
      });

      return {
        columns: [
          { header: 'Item', dataKey: 'item_name' },
          { header: 'Category', dataKey: 'category' },
          { header: 'Quantity', dataKey: 'quantity' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Notes', dataKey: 'notes' }
        ],
        rows: logistics
      };
    }

    // Fallback to API
    const response = await fetch(`../api/logistics.php?event_id=${eventId}`, {
      headers: getUserHeaders()
    }).catch(() => null);

    let logistics = [];
    
    if (response && response.ok) {
      const data = await response.json();
      logistics = Array.isArray(data) ? data : data.data || [];
    }

    return {
      columns: [
        { header: 'Item', dataKey: 'item_name' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Quantity', dataKey: 'quantity' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Notes', dataKey: 'notes' }
      ],
      rows: logistics.map(l => ({
        item_name: l.item_name || l.name || 'N/A',
        category: l.category || 'General',
        quantity: l.quantity || '0',
        status: l.status || 'Pending',
        notes: (l.notes || l.description || 'N/A').substring(0, 50)
      }))
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
    // Try to get from DOM first
    const financeRows = document.querySelectorAll('#financeTableBody tr, #eventFinanceTableBody tr');
    
    if (financeRows && financeRows.length > 0) {
      const expenses = Array.from(financeRows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          description: cells[0]?.textContent?.trim() || 'N/A',
          category: cells[1]?.textContent?.trim() || 'Other',
          amount: cells[2]?.textContent?.trim() || '$0.00',
          date: cells[3]?.textContent?.trim() || 'N/A',
          status: cells[4]?.textContent?.trim() || 'Pending'
        };
      });

      return {
        columns: [
          { header: 'Description', dataKey: 'description' },
          { header: 'Category', dataKey: 'category' },
          { header: 'Amount', dataKey: 'amount' },
          { header: 'Date', dataKey: 'date' },
          { header: 'Status', dataKey: 'status' }
        ],
        rows: expenses
      };
    }

    // Fallback to API
    const response = await fetch(`../api/finance.php?event_id=${eventId}`, {
      headers: getUserHeaders()
    }).catch(() => null);

    let expenses = [];
    
    if (response && response.ok) {
      const data = await response.json();
      expenses = Array.isArray(data) ? data : data.data || [];
    }

    return {
      columns: [
        { header: 'Description', dataKey: 'description' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Date', dataKey: 'date' },
        { header: 'Status', dataKey: 'status' }
      ],
      rows: expenses.map(e => ({
        description: e.description || 'N/A',
        category: e.category || 'Other',
        amount: e.amount ? (typeof e.amount === 'string' && e.amount.startsWith('$') ? e.amount : `$${parseFloat(e.amount).toFixed(2)}`) : '$0.00',
        date: e.date ? formatDate(e.date) : 'N/A',
        status: e.status || 'Pending'
      }))
    };
  } catch (error) {
    console.error('Error fetching finance:', error);
    return { columns: [], rows: [] };
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
