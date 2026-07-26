"""
Password Generator — CodeArcade
=================================
Pure Python logic for generating secure passwords.

Key concepts: Randomization, character sets, password strength analysis.
"""

import random
import string


def generate_password(length=16, use_upper=True, use_numbers=True, use_symbols=True):
    """Generate a random password with configurable options."""
    chars = string.ascii_lowercase
    if use_upper:
        chars += string.ascii_uppercase
    if use_numbers:
        chars += string.digits
    if use_symbols:
        chars += string.punctuation

    password = ''.join(random.choice(chars) for _ in range(length))
    return password


def check_strength(password):
    """Return password strength: 'weak', 'medium', or 'strong'."""
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if any(c.isupper() for c in password):
        score += 1
    if any(c.isdigit() for c in password):
        score += 1
    if any(c in string.punctuation for c in password):
        score += 1

    if score <= 2:
        return 'weak'
    elif score <= 3:
        return 'medium'
    else:
        return 'strong'
