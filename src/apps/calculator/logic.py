"""
Calculator — CodeArcade
========================
Pure Python logic for a calculator application.
Evaluates mathematical expressions safely.

Key concepts: Expression parsing, operator precedence, error handling.
"""


def calculate(expression):
    """
    Evaluate a mathematical expression string safely.

    Args:
        expression: A string like "2 + 3 * 4"

    Returns:
        A dict with 'result' (float) or 'error' (str).
    """
    try:
        # Sanitize: only allow digits, operators, parentheses, decimal points
        allowed = set('0123456789+-*/.() ')
        if not all(c in allowed for c in expression):
            return {'error': 'Invalid characters in expression'}

        if not expression.strip():
            return {'error': 'Empty expression'}

        result = eval(expression)  # Safe because we sanitized input
        return {'result': float(result)}
    except ZeroDivisionError:
        return {'error': 'Cannot divide by zero'}
    except Exception as e:
        return {'error': f'Invalid expression: {str(e)}'}
