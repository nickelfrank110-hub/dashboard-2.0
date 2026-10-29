function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// 1. Core State (Data Store)
let transactions = [];
try { transactions = JSON.parse(localStorage.getItem('transactions')) || []; } catch (e) {}

// 2. DOM Elements Selection
const form = document.getElementById('transaction-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const tableBody = document.getElementById('table-body');

const totalRevenueEl = document.getElementById('total-revenue');
const totalExpensesEl = document.getElementById('total-expenses');
const netProfitEl = document.getElementById('net-profit');

// 3. Main Controller Function: Update UI and Recalculate Logic
function updateDashboard() {
try { localStorage.setItem('transactions', JSON.stringify(transactions)); } catch (e) {}
    // Clear existing table contents
    tableBody.innerHTML = '';
        if (transactions.length === 0) {
                 tableBody.innerHTML = '<tr><td colspan="6" class="empty">No transactions yet. Add one, or <button type="button" id="sample-btn" class="link-btn">load sample data</button>.</td></tr>';
    }
    
    let totalRevenue = 0;
    let totalExpenses = 0;
        let byCategory = {};

    // Loop through state array to render rows and tally values
    transactions.forEach(transaction => {
        // Calculate Totals
        if (transaction.type === 'revenue') {
            totalRevenue += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
                        byCategory[transaction.category || 'Other'] = (byCategory[transaction.category || 'Other'] || 0) + transaction.amount;
        }

        // Create table row dynamically
        const row = document.createElement('tr');
        
        // Add color badge based on entry type
        const badgeClass = transaction.type === 'revenue' ? 'type-revenue' : 'type-expense';
        const typeLabel = transaction.type === 'revenue' ? 'Revenue' : 'Expense';
        const sign = transaction.type === 'revenue' ? '+' : '-';

        row.innerHTML = `
            <td>${esc(transaction.description)}</td>
                        <td>${esc(transaction.category || '-')}</td>
            <td>${esc(transaction.date || '-')}</td>
            <td><span class="type-badge ${badgeClass}">${typeLabel}</span></td>
            <td>${sign}$${transaction.amount.toFixed(2)}</td>
            <td>
                                <button class="btn-delete" onclick="deleteTransaction(${transaction.id})" aria-label="Delete ${esc(transaction.description)}">✕</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    // Calculate Net Profit Margin Percentage: ((Rev - Exp) / Rev) * 100
    let margin = 0;
    if (totalRevenue > 0) {
        margin = ((totalRevenue - totalExpenses) / totalRevenue) * 100;
    }

    // Render calculated figures to screen
    totalRevenueEl.innerText = `$${totalRevenue.toFixed(2)}`;
    totalExpensesEl.innerText = `$${totalExpenses.toFixed(2)}`;
        netProfitEl.classList.remove('positive', 'negative');
    if (totalRevenue > 0) {
        netProfitEl.innerText = `${margin.toFixed(0)}%`;
        netProfitEl.classList.add(margin >= 0 ? 'positive' : 'negative');
    } else if (totalExpenses > 0) {
        netProfitEl.innerText = 'No revenue';
        netProfitEl.classList.add('negative');
    } else {
        netProfitEl.innerText = '0%';
    }
    renderChart(byCategory, totalExpenses);
    }

// 4. Action Function: Add Transaction
form.addEventListener('submit', function(e) {
    e.preventDefault(); // Stop standard form reload

    // Create a new data object
    const newTransaction = {
        id: Date.now(), // Generate a unique identifier
        description: descInput.value.trim(),
        amount: parseFloat(amountInput.value),
                type: typeInput.value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
    };

    // Push into state and trigger UI layout refresh
    transactions.push(newTransaction);
    updateDashboard();

    // Reset standard input elements for next entry
    form.reset();
        document.getElementById('date').value = new Date().toLocaleDateString('en-CA');
});

// 5. Action Function: Delete Transaction
window.deleteTransaction = function(id) {
    // Filter array to exclude targeted id
    transactions = transactions.filter(t => t.id !== id);
    // Refresh calculations and tables
    updateDashboard();
};
updateDashboard();
document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
document.getElementById('date').value = new Date().toLocaleDateString('en-CA');
function renderChart(byCategory, total) {
    const chart = document.getElementById('chart');
    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
        chart.innerHTML = '<p class="muted">Log an expense to see where your money goes.</p>';
        return;
    }
    chart.innerHTML = entries.map(([name, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        return `<div class="bar-row">
            <span>${esc(name)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
            <span class="muted">$${amount.toFixed(2)} (${pct.toFixed(0)}%)</span>
        </div>`;
    }).join('');
}
document.getElementById('export-btn').addEventListener('click', function() {
    const safe = v => {
        let s = String(v);
        if (/^[=+\-@]/.test(s)) s = "'" + s;
        return '"' + s.replace(/"/g, '""') + '"';
    };
    const rows = [['Date', 'Description', 'Type', 'Category', 'Amount']].concat(
        transactions.map(t => [t.date || '', t.description, t.type, t.category || '', t.amount.toFixed(2)])
    );
    const csv = rows.map(r => r.map(safe).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'transactions.csv';
    link.click();
    URL.revokeObjectURL(link.href);
});
tableBody.addEventListener('click', function(e) {
    if (!e.target.closest('#sample-btn')) return;
    const month = new Date().toLocaleDateString('en-CA').slice(0, 8);
    const rows = [
        ['Pro plan subscriptions', 8420, 'revenue', 'Subscriptions', '03'],
        ['Consulting project', 3200, 'revenue', 'Services', '09'],
        ['Cloud hosting', 1180, 'expense', 'Hosting', '05'],
        ['Team payroll', 4100, 'expense', 'Payroll', '15'],
        ['Ad campaign', 950, 'expense', 'Marketing', '12'],
        ['Design tools', 240, 'expense', 'Other', '07']
    ];
    transactions = rows.map((r, i) => ({
        id: Date.now() + i,
        description: r[0],
        amount: r[1],
        type: r[2],
        category: r[3],
        date: month + r[4]
    }));
    updateDashboard();
});
