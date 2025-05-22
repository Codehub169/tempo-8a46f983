document.addEventListener('DOMContentLoaded', () => {
    const addGoalForm = document.getElementById('add-goal-form');
    const goalsList = document.getElementById('goals-list');
    const editGoalModal = document.getElementById('edit-goal-modal');
    const editGoalForm = document.getElementById('edit-goal-form');
    const cancelEditGoalButton = document.getElementById('cancel-edit-goal');
    let editingGoalId = null;

    // Load goals on page load
    loadGoals();

    // Event listener for adding a new goal
    if (addGoalForm) {
        addGoalForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(addGoalForm);
            const goalData = {
                name: formData.get('goal-name'),
                target_amount: parseFloat(formData.get('goal-target-amount')),
                current_amount: parseFloat(formData.get('goal-current-amount')) || 0,
                deadline: formData.get('goal-deadline'),
            };

            if (!goalData.name || isNaN(goalData.target_amount) || goalData.target_amount <= 0) {
                showNotification('Goal name and valid target amount are required.', 'error');
                return;
            }
            if (goalData.deadline && new Date(goalData.deadline) < new Date().setHours(0,0,0,0)) {
                showNotification('Deadline cannot be in the past.', 'error');
                return;
            }

            toggleLoadingSpinner(true);
            const response = await fetchAPI('/api/goals', { method: 'POST', body: goalData });
            toggleLoadingSpinner(false);

            if (response && response.id) {
                showNotification('Goal added successfully!', 'success');
                addGoalForm.reset();
                loadGoals();
            } else {
                showNotification(response.error || 'Failed to add goal. Please try again.', 'error');
            }
        });
    }

    // Function to load and display goals
    async function loadGoals() {
        toggleLoadingSpinner(true);
        const response = await fetchAPI('/api/goals');
        toggleLoadingSpinner(false);

        if (goalsList) {
            goalsList.innerHTML = ''; // Clear existing goals
            if (response && Array.isArray(response) && response.length > 0) {
                response.forEach(goal => {
                    const goalElement = createGoalElement(goal);
                    goalsList.appendChild(goalElement);
                });
            } else if (response && response.error) {
                showNotification(response.error, 'error');
                goalsList.innerHTML = '<li>Failed to load goals.</li>';
            } else {
                goalsList.innerHTML = '<li>No savings goals found. Start by adding one!</li>';
            }
        }
    }

    // Function to create HTML element for a single goal
    function createGoalElement(goal) {
        const li = document.createElement('li');
        li.classList.add('goal-item', 'card');
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        
        li.innerHTML = `
            <div class="goal-item-content">
                <h4>${goal.name}</h4>
                <p class="goal-amounts">
                    <span class="current-amount">${formatCurrency(goal.current_amount)}</span> / 
                    <span class="target-amount">${formatCurrency(goal.target_amount)}</span>
                </p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${Math.min(progress, 100)}%;"></div>
                </div>
                <p class="goal-progress-text">${Math.min(progress, 100).toFixed(1)}% Complete</p>
                ${goal.deadline ? `<p class=\"goal-deadline\"><i class=\"material-icons\">event</i> Deadline: ${formatDate(goal.deadline)}</p>` : ''}
            </div>
            <div class="goal-actions">
                <button class="btn btn-icon btn-edit" data-id="${goal.id}"><i class="material-icons">edit</i></button>
                <button class="btn btn-icon btn-delete btn-secondary" data-id="${goal.id}"><i class="material-icons">delete</i></button>
            </div>
        `;

        // Event listeners for edit and delete buttons
        li.querySelector('.btn-edit').addEventListener('click', () => openEditModal(goal));
        li.querySelector('.btn-delete').addEventListener('click', () => deleteGoal(goal.id));
        return li;
    }

    // Function to open the edit modal and populate form
    function openEditModal(goal) {
        if (!editGoalModal || !editGoalForm) return;
        editingGoalId = goal.id;
        document.getElementById('edit-goal-id').value = goal.id;
        document.getElementById('edit-goal-name').value = goal.name;
        document.getElementById('edit-goal-target-amount').value = goal.target_amount;
        document.getElementById('edit-goal-current-amount').value = goal.current_amount;
        document.getElementById('edit-goal-deadline').value = goal.deadline ? goal.deadline.split('T')[0] : '';
        editGoalModal.style.display = 'block';
    }

    // Event listener for submitting the edit goal form
    if (editGoalForm) {
        editGoalForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!editingGoalId) return;

            const formData = new FormData(editGoalForm);
            const goalData = {
                name: formData.get('goal-name'),
                target_amount: parseFloat(formData.get('goal-target-amount')),
                current_amount: parseFloat(formData.get('goal-current-amount')),
                deadline: formData.get('goal-deadline'),
            };

            if (!goalData.name || isNaN(goalData.target_amount) || goalData.target_amount <= 0) {
                showNotification('Goal name and valid target amount are required for update.', 'error');
                return;
            }
            if (goalData.deadline && new Date(goalData.deadline) < new Date().setHours(0,0,0,0)) {
                showNotification('Deadline cannot be in the past.', 'error');
                return;
            }

            toggleLoadingSpinner(true);
            const response = await fetchAPI(`/api/goals/${editingGoalId}`, { method: 'PUT', body: goalData });
            toggleLoadingSpinner(false);

            if (response && response.id) {
                showNotification('Goal updated successfully!', 'success');
                closeEditModal();
                loadGoals();
            } else {
                showNotification(response.error || 'Failed to update goal. Please try again.', 'error');
            }
        });
    }
    
    // Function to close the edit modal
    function closeEditModal() {
        if (editGoalModal) editGoalModal.style.display = 'none';
        editingGoalId = null;
        if(editGoalForm) editGoalForm.reset();
    }

    if (cancelEditGoalButton) {
        cancelEditGoalButton.addEventListener('click', closeEditModal);
    }

    // Close modal if user clicks outside of it (optional)
    window.addEventListener('click', (event) => {
        if (event.target === editGoalModal) {
            closeEditModal();
        }
    });

    // Function to delete a goal
    async function deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        toggleLoadingSpinner(true);
        const response = await fetchAPI(`/api/goals/${goalId}`, { method: 'DELETE' });
        toggleLoadingSpinner(false);

        if (response && response.message) {
            showNotification(response.message, 'success');
            loadGoals();
        } else {
            showNotification(response.error || 'Failed to delete goal. Please try again.', 'error');
        }
    }
});
