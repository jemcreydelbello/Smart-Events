// Load budget data for dashboard KPIs
function loadDashboardBudgetData(eventId) {
    if (!eventId) {
        return;
    }
    
    fetch(`${API_BASE}/finance.php?action=list&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const grandTotal = parseFloat(data.grand_total) || 0;
            const expenseCount = (data.data && Array.isArray(data.data)) ? data.data.length : 0;
            const formattedAmount = grandTotal.toFixed(2);
            
            const budgetEl = document.getElementById('dashBudget');
            const budgetDetailEl = document.getElementById('dashBudgetDetail');
            
            if (budgetEl) {
                budgetEl.textContent = '₱' + formattedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            if (budgetDetailEl) {
                budgetDetailEl.textContent = expenseCount + ' EXPENSE LINE ITEMS';
            }
            
            console.log('[Dashboard] Budget KPI updated to: ₱' + formattedAmount + ' (' + expenseCount + ' items)');
        }
    })
    .catch(error => {
        console.error('[Dashboard] Error loading budget:', error);
    });
}

// Load logistics data for dashboard KPIs
function loadDashboardLogisticsData(eventId) {
    if (!eventId) {
        return;
    }
    
    fetch(`${API_BASE}/logistics.php?action=list&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && Array.isArray(data.data)) {
            const logisticsData = data.data;
            const totalItems = logisticsData.length;
            const completedItems = logisticsData.filter(item => {
                const status = item.status ? item.status.toLowerCase() : '';
                return status === 'completed' || status === 'done' || status === 'finished';
            }).length;
            
            const readinessPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            
            const logisticsEl = document.getElementById('dashLogistics');
            const logisticsDetailEl = document.getElementById('dashLogisticsDetail');
            
            if (logisticsEl) {
                logisticsEl.textContent = readinessPercent + '%';
            }
            if (logisticsDetailEl) {
                logisticsDetailEl.textContent = totalItems + ' LOGISTICS ITEMS TRACKED';
            }
            
            console.log('[Dashboard] Logistics KPI updated to: ' + readinessPercent + '% (' + totalItems + ' items, ' + completedItems + ' completed)');
        }
    })
    .catch(error => {
        console.error('[Dashboard] Error loading logistics:', error);
    });
}
