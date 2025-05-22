import sqlite3
from models import TRANSACTIONS_TABLE_SCHEMA, GOALS_TABLE_SCHEMA

DATABASE_NAME = 'budget.db'

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def init_db():
    """Initializes the database and creates tables if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(TRANSACTIONS_TABLE_SCHEMA)
    cursor.execute(GOALS_TABLE_SCHEMA)
    conn.commit()
    conn.close()

# --- Transaction Functions ---
def add_transaction_db(type, category, amount, date, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)",
        (type, category, amount, date, description)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return get_transaction_by_id_db(new_id)

def get_all_transactions_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY date DESC")
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return transactions

def get_transaction_by_id_db(transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_transaction_db(transaction_id, type, category, amount, date, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE transactions SET type=?, category=?, amount=?, date=?, description=? WHERE id=?",
        (type, category, amount, date, description, transaction_id)
    )
    conn.commit()
    updated_rows = cursor.rowcount
    conn.close()
    return get_transaction_by_id_db(transaction_id) if updated_rows > 0 else None

def delete_transaction_db(transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    deleted_rows = cursor.rowcount
    conn.close()
    return deleted_rows > 0

# --- Goal Functions ---
def add_goal_db(name, target_amount, current_amount, deadline):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO goals (name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?)",
        (name, target_amount, current_amount, deadline)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return get_goal_by_id_db(new_id)

def get_all_goals_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM goals ORDER BY deadline")
    goals = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return goals

def get_goal_by_id_db(goal_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_goal_db(goal_id, name, target_amount, current_amount, deadline):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE goals SET name=?, target_amount=?, current_amount=?, deadline=? WHERE id=?",
        (name, target_amount, current_amount, deadline, goal_id)
    )
    conn.commit()
    updated_rows = cursor.rowcount
    conn.close()
    return get_goal_by_id_db(goal_id) if updated_rows > 0 else None

def delete_goal_db(goal_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
    conn.commit()
    deleted_rows = cursor.rowcount
    conn.close()
    return deleted_rows > 0
