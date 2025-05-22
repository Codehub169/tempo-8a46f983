from flask import Flask, request, jsonify, render_template
import database
import os

# Initialize the database (create tables if they don't exist)
# This should be called once when the application starts.
database.init_db()

app = Flask(__name__, template_folder='templates', static_folder='static')

# --- HTML Page Routes ---
@app.route('/')
def dashboard_page():
    """Serves the main dashboard page."""
    return render_template('dashboard.html')

@app.route('/transactions')
def transactions_page():
    """Serves the transactions management page."""
    return render_template('transactions.html')

@app.route('/goals')
def goals_page():
    """Serves the savings goals management page."""
    return render_template('goals.html')

# --- API Endpoints for Transactions ---
@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    if not data or not all(k in data for k in ('type', 'category', 'amount', 'date')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Ensure amount is a float
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400

    # Validate type
    if data['type'] not in ['income', 'expense']:
        return jsonify({'error': 'Invalid transaction type'}), 400

    new_transaction = database.add_transaction_db(
        data['type'],
        data['category'],
        amount,
        data['date'],
        data.get('description', '')
    )
    return jsonify(new_transaction), 201

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = database.get_all_transactions_db()
    return jsonify(transactions)

@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    transaction = database.get_transaction_by_id_db(transaction_id)
    if transaction:
        return jsonify(transaction)
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    
    try:
        if 'amount' in data:
            data['amount'] = float(data['amount'])
            if data['amount'] <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400
    
    if 'type' in data and data['type'] not in ['income', 'expense']:
        return jsonify({'error': 'Invalid transaction type'}), 400

    # Fetch existing to merge, or ensure all fields are present if your DB layer requires it.
    # For simplicity, this example assumes the DB layer handles partial updates or expects all fields.
    # The database.py provided expects all fields for an update.
    existing_transaction = database.get_transaction_by_id_db(transaction_id)
    if not existing_transaction:
        return jsonify({'error': 'Transaction not found'}), 404

    updated_data = {
        'type': data.get('type', existing_transaction['type']),
        'category': data.get('category', existing_transaction['category']),
        'amount': data.get('amount', existing_transaction['amount']),
        'date': data.get('date', existing_transaction['date']),
        'description': data.get('description', existing_transaction['description'])
    }

    updated_transaction = database.update_transaction_db(
        transaction_id,
        updated_data['type'],
        updated_data['category'],
        updated_data['amount'],
        updated_data['date'],
        updated_data['description']
    )
    if updated_transaction:
        return jsonify(updated_transaction)
    return jsonify({'error': 'Failed to update transaction or transaction not found'}), 404 # Or 500 if it's an internal error

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    if database.delete_transaction_db(transaction_id):
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    return jsonify({'error': 'Transaction not found or could not be deleted'}), 404

# --- API Endpoints for Goals ---
@app.route('/api/goals', methods=['POST'])
def add_goal():
    data = request.get_json()
    if not data or not all(k in data for k in ('name', 'target_amount')):
        return jsonify({'error': 'Missing required fields: name, target_amount'}), 400
    
    try:
        target_amount = float(data['target_amount'])
        current_amount = float(data.get('current_amount', 0.0))
        if target_amount <= 0:
            return jsonify({'error': 'Target amount must be positive'}), 400
        if current_amount < 0:
             return jsonify({'error': 'Current amount cannot be negative'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400

    new_goal = database.add_goal_db(
        data['name'],
        target_amount,
        current_amount,
        data.get('deadline') # Optional
    )
    return jsonify(new_goal), 201

@app.route('/api/goals', methods=['GET'])
def get_goals():
    goals = database.get_all_goals_db()
    return jsonify(goals)

@app.route('/api/goals/<int:goal_id>', methods=['GET'])
def get_goal(goal_id):
    goal = database.get_goal_by_id_db(goal_id)
    if goal:
        return jsonify(goal)
    return jsonify({'error': 'Goal not found'}), 404

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400

    existing_goal = database.get_goal_by_id_db(goal_id)
    if not existing_goal:
        return jsonify({'error': 'Goal not found'}), 404

    try:
        target_amount = float(data.get('target_amount', existing_goal['target_amount']))
        current_amount = float(data.get('current_amount', existing_goal['current_amount']))
        if target_amount <= 0:
            return jsonify({'error': 'Target amount must be positive'}), 400
        if current_amount < 0:
             return jsonify({'error': 'Current amount cannot be negative'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400

    updated_data = {
        'name': data.get('name', existing_goal['name']),
        'target_amount': target_amount,
        'current_amount': current_amount,
        'deadline': data.get('deadline', existing_goal['deadline'])
    }

    updated_goal = database.update_goal_db(
        goal_id,
        updated_data['name'],
        updated_data['target_amount'],
        updated_data['current_amount'],
        updated_data['deadline']
    )
    if updated_goal:
        return jsonify(updated_goal)
    return jsonify({'error': 'Failed to update goal or goal not found'}), 404

@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    if database.delete_goal_db(goal_id):
        return jsonify({'message': 'Goal deleted successfully'}), 200
    return jsonify({'error': 'Goal not found or could not be deleted'}), 404

# --- API Endpoint for Dashboard Data ---
@app.route('/api/dashboard_data', methods=['GET'])
def get_dashboard_data():
    transactions = database.get_all_transactions_db()
    goals = database.get_all_goals_db()

    total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    total_expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    balance = total_income - total_expenses

    spending_by_category = {}
    for t in transactions:
        if t['type'] == 'expense':
            spending_by_category[t['category']] = spending_by_category.get(t['category'], 0) + t['amount']
    
    # Sort categories by amount for better visualization later
    sorted_spending_by_category = dict(sorted(spending_by_category.items(), key=lambda item: item[1], reverse=True))

    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'balance': balance,
        'spending_by_category': sorted_spending_by_category,
        'recent_transactions': transactions[:5], # Example: 5 most recent
        'goals_summary': goals
    })

if __name__ == '__main__':
    # The port 9000 is specified for the frontend interaction point.
    app.run(host='0.0.0.0', port=9000, debug=True)
