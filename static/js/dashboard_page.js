document.addEventListener('DOMContentLoaded', () => {
    // Initialize Chart.js default options if needed (e.g., font color)
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = 'Roboto, Arial, Helvetica, sans-serif';
        Chart.defaults.color = '#343a40'; // --text-color
    }

    loadDashboardData();
});

let spendingChartInstance = null;
let incomeExpenseChartInstance = null;

async function loadDashboardData() {
    toggleLoadingSpinner(true);
    try {
        const data = await fetchAPI('/api/dashboard_data');
        if (data) {
            updateSummaryMetrics(data.total_income, data.total_expenses, data.net_balance);
            renderRecentTransactions(data.recent_transactions);
            renderSavingsGoalsSummary(data.goal_summary);
            renderSpendingBreakdownChart(data.spending_by_category);
            renderIncomeExpenseChart(data.total_income, data.total_expenses);
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Could not load dashboard data. Please try again later.', 'error');
        // Optionally display an error message directly on the dashboard sections
        document.getElementById('dashboard-summary-section').innerHTML = '<p class="text-danger">Error loading summary.</p>';
        // etc. for other sections
    }
    toggleLoadingSpinner(false);
}

function updateSummaryMetrics(income, expenses, balance) {
    document.getElementById('total-income').textContent = formatCurrency(income || 0);
    document.getElementById('total-expenses').textContent = formatCurrency(expenses || 0);
    document.getElementById('net-balance').textContent = formatCurrency(balance || 0);

    // Style net balance based on positive/negative
    const netBalanceEl = document.getElementById('net-balance');
    if (balance < 0) {
        netBalanceEl.classList.remove('text-primary', 'text-success');
        netBalanceEl.classList.add('text-secondary');
    } else {
        netBalanceEl.classList.remove('text-secondary');
        netBalanceEl.classList.add('text-success'); // Or text-primary depending on preference
    }
}

function renderRecentTransactions(transactions) {
    const listElement = document.getElementById('recent-transactions-list');
    if (!listElement) return;
    listElement.innerHTML = ''; // Clear previous items

    if (!transactions || transactions.length === 0) {
        listElement.innerHTML = '<li>No recent transactions.</li>';
        return;
    }

    transactions.slice(0, 5).forEach(tx => { // Show top 5 or as many as returned
        const listItem = document.createElement('li');
        const amountClass = tx.type === 'income' ? 'income' : 'expense';
        listItem.innerHTML = `
            <span class="item-name">${tx.category} (${formatDate(tx.date)})</span>
            <span class="item-amount ${amountClass}">${formatCurrency(tx.amount)}</span>
        `;
        // Add description if available, perhaps as a tooltip or smaller text
        if(tx.description) {
            listItem.title = tx.description;
        }
        listElement.appendChild(listItem);
    });
}

function renderSavingsGoalsSummary(goals) {
    const container = document.getElementById('savings-goals-summary');
    if (!container) return;
    container.innerHTML = ''; // Clear previous items

    if (!goals || goals.length === 0) {
        container.innerHTML = '<p>No savings goals set up yet.</p>';
        return;
    }

    goals.forEach(goal => {
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        const goalElement = document.createElement('div');
        goalElement.className = 'goal-item mb-2';
        goalElement.innerHTML = `
            <div class="d-flex justify-content-between">
                <strong>${goal.name}</strong>
                <span>${formatCurrency(goal.current_amount)} / ${formatCurrency(goal.target_amount)}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${Math.min(progress, 100).toFixed(2)}%;" role="progressbar" aria-valuenow="${progress.toFixed(2)}" aria-valuemin="0" aria-valuemax="100">
                    ${progress.toFixed(0)}%
                </div>
            </div>
            ${goal.deadline ? `<small class="text-muted">Deadline: ${formatDate(goal.deadline)}</small>` : ''}
        `;
        container.appendChild(goalElement);
    });
}

function renderSpendingBreakdownChart(spendingData) {
    const ctx = document.getElementById('spending-chart')?.getContext('2d');
    if (!ctx || !spendingData) return;

    const labels = Object.keys(spendingData);
    const data = Object.values(spendingData);

    if (labels.length === 0) {
        document.getElementById('spending-chart-container').innerHTML = '<p>No spending data available for chart.</p>';
        return;
    }

    const chartColors = ['#007bff', '#dc3545', '#ffc107', '#28a745', '#17a2b8', '#6c757d', '#f8f9fa', '#343a40'];

    if (spendingChartInstance) {
        spendingChartInstance.destroy();
    }

    spendingChartInstance = new Chart(ctx, {
        type: 'doughnut', // Or 'pie'
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending by Category',
                data: data,
                backgroundColor: chartColors.slice(0, labels.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Spending Breakdown'
                }
            }
        }
    });
}

function renderIncomeExpenseChart(totalIncome, totalExpenses) {
    const ctx = document.getElementById('income-expense-chart')?.getContext('2d');
    if (!ctx) return;

    if (incomeExpenseChartInstance) {
        incomeExpenseChartInstance.destroy();
    }

    incomeExpenseChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Financial Overview'],
            datasets: [
                {
                    label: 'Total Income',
                    data: [totalIncome || 0],
                    backgroundColor: 'rgba(0, 123, 255, 0.7)', // Primary color with alpha
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Expenses',
                    data: [totalExpenses || 0],
                    backgroundColor: 'rgba(220, 53, 69, 0.7)', // Secondary color with alpha
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value, '', false); // Basic currency formatting for axis
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Income vs. Expenses'
                }
            }
        }
    });
}

// Ensure common.js functions are available or define stubs if run in isolation for testing
if (typeof formatCurrency === 'undefined') {
    function formatCurrency(amount) { return `$${Number(amount).toFixed(2)}`; }
}
if (typeof formatDate === 'undefined') {
    function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString(); }
}
if (typeof fetchAPI === 'undefined') {
    async function fetchAPI(url) { console.error('fetchAPI not defined'); return Promise.reject('fetchAPI not defined'); }
}
if (typeof toggleLoadingSpinner === 'undefined') {
    function toggleLoadingSpinner(show) { console.log(`Spinner: ${show}`); }
}
if (typeof showNotification === 'undefined') {
    function showNotification(msg, type) { console.log(`Notification (${type}): ${msg}`); }
}
