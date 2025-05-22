document.addEventListener('DOMContentLoaded', () => {
    const addTransactionForm = document.getElementById('add-transaction-form');
    const transactionsTableBody = document.getElementById('transactions-table-body');
    const editTransactionModal = document.getElementById('edit-transaction-modal');
    const editTransactionForm = document.getElementById('edit-transaction-form');
    const cancelEditTransactionButton = document.getElementById('cancel-edit-transaction');
    let editingTransactionId = null;

    // Load transactions on page load
    loadTransactions();

    // Event listener for adding a new transaction
    if (addTransactionForm) {
        addTransactionForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(addTransactionForm);
            const transactionData = {
                type: formData.get('transaction-type'),
                category: formData.get('transaction-category'),
                amount: parseFloat(formData.get('transaction-amount')),
                date: formData.get('transaction-date'),
                description: formData.get('transaction-description'),
            };

            if (!transactionData.type || !transactionData.category || isNaN(transactionData.amount) || !transactionData.date || transactionData.amount <= 0) {
                showNotification('Type, category, date, and a valid positive amount are required.', 'error');
                return;
            }

            toggleLoadingSpinner(true);
            const response = await fetchAPI('/api/transactions', { method: 'POST', body: transactionData });
            toggleLoadingSpinner(false);

            if (response && response.id) {
                showNotification('Transaction added successfully!', 'success');
                addTransactionForm.reset();
                loadTransactions();
            } else {
                showNotification(response.error || 'Failed to add transaction. Please try again.', 'error');
            }
        });
    }

    // Function to load and display transactions
    async function loadTransactions() {
        toggleLoadingSpinner(true);
        const response = await fetchAPI('/api/transactions');
        toggleLoadingSpinner(false);

        if (transactionsTableBody) {
            transactionsTableBody.innerHTML = ''; // Clear existing transactions
            if (response && Array.isArray(response) && response.length > 0) {
                response.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
                response.forEach(transaction => {
                    const transactionRow = createTransactionRow(transaction);
                    transactionsTableBody.appendChild(transactionRow);
                });
            } else if (response && response.error) {
                showNotification(response.error, 'error');
                const row = transactionsTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6;
                cell.textContent = 'Failed to load transactions.';
                cell.style.textAlign = 'center';
            } else {
                const row = transactionsTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6;
                cell.textContent = 'No transactions found. Add one to get started!';
                cell.style.textAlign = 'center';
            }
        }
    }

    // Function to create HTML table row for a single transaction
    function createTransactionRow(transaction) {
        const row = document.createElement('tr');
        row.classList.add(transaction.type === 'income' ? 'income-row' : 'expense-row');
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td><span class="transaction-type-indicator ${transaction.type}">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span></td>
            <td>${transaction.category}</td>
            <td class="amount">${formatCurrency(transaction.amount)}</td>
            <td>${transaction.description || '-'}</td>
            <td class="actions">
                <button class="btn btn-icon btn-edit" data-id="${transaction.id}"><i class="material-icons">edit</i></button>
                <button class="btn btn-icon btn-delete btn-secondary" data-id="${transaction.id}"><i class="material-icons">delete</i></button>
            </td>
        `;

        // Event listeners for edit and delete buttons
        row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(transaction));
        row.querySelector('.btn-delete').addEventListener('click', () => deleteTransaction(transaction.id));
        return row;
    }

    // Function to open the edit modal and populate form
    function openEditModal(transaction) {
        if (!editTransactionModal || !editTransactionForm) return;
        editingTransactionId = transaction.id;
        document.getElementById('edit-transaction-id').value = transaction.id;
        document.getElementById('edit-transaction-type').value = transaction.type;
        document.getElementById('edit-transaction-category').value = transaction.category;
        document.getElementById('edit-transaction-amount').value = transaction.amount;
        document.getElementById('edit-transaction-date').value = transaction.date.split('T')[0];
        document.getElementById('edit-transaction-description').value = transaction.description;
        editTransactionModal.style.display = 'block';
    }

    // Event listener for submitting the edit transaction form
    if (editTransactionForm) {
        editTransactionForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!editingTransactionId) return;

            const formData = new FormData(editTransactionForm);
            const transactionData = {
                type: formData.get('transaction-type'),
                category: formData.get('transaction-category'),
                amount: parseFloat(formData.get('transaction-amount')),
                date: formData.get('transaction-date'),
                description: formData.get('transaction-description'),
            };
            
            if (!transactionData.type || !transactionData.category || isNaN(transactionData.amount) || !transactionData.date || transactionData.amount <= 0) {
                showNotification('Type, category, date, and a valid positive amount are required for update.', 'error');
                return;
            }

            toggleLoadingSpinner(true);
            const response = await fetchAPI(`/api/transactions/${editingTransactionId}`, { method: 'PUT', body: transactionData });
            toggleLoadingSpinner(false);

            if (response && response.id) {
                showNotification('Transaction updated successfully!', 'success');
                closeEditModal();
                loadTransactions();
            } else {
                showNotification(response.error || 'Failed to update transaction. Please try again.', 'error');
            }
        });
    }

    function closeEditModal() {
        if (editTransactionModal) editTransactionModal.style.display = 'none';
        editingTransactionId = null;
        if(editTransactionForm) editTransactionForm.reset();
    }

    if (cancelEditTransactionButton) {
        cancelEditTransactionButton.addEventListener('click', closeEditModal);
    }

    window.addEventListener('click', (event) => {
        if (event.target === editTransactionModal) {
            closeEditModal();
        }
    });

    // Function to delete a transaction
    async function deleteTransaction(transactionId) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        toggleLoadingSpinner(true);
        const response = await fetchAPI(`/api/transactions/${transactionId}`, { method: 'DELETE' });
        toggleLoadingSpinner(false);

        if (response && response.message) {
            showNotification(response.message, 'success');
            loadTransactions();
        } else {
            showNotification(response.error || 'Failed to delete transaction. Please try again.', 'error');
        }
    }
});
