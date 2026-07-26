"""
Unit Converter — CodeArcade
==============================
Pure Python logic for unit conversions across multiple categories.

Key concepts: Lookup tables for unit ratios, base-unit normalisation,
conversion formula composition, type-safe numeric handling.

Categories:
    Length      — km, m, cm, mm, mile, yard, foot, inch
    Temperature — Celsius, Fahrenheit, Kelvin
    Currency    — Static rate table (USD as base currency, July 2025 rates)
"""


# ── Length ────────────────────────────────────────────────────────────────────
# All values in metres
LENGTH_TO_METRES = {
    'km':    1000,
    'm':     1,
    'cm':    0.01,
    'mm':    0.001,
    'mile':  1609.344,
    'yard':  0.9144,
    'foot':  0.3048,
    'inch':  0.0254,
}

LENGTH_UNITS = list(LENGTH_TO_METRES.keys())


def convert_length(value, from_unit, to_unit):
    """
    Convert a length value from one unit to another.
    Uses metres as the base unit for all conversions.
    """
    value = float(value)
    if from_unit not in LENGTH_TO_METRES or to_unit not in LENGTH_TO_METRES:
        raise ValueError(f'Unknown length unit: {from_unit!r} or {to_unit!r}')
    metres = value * LENGTH_TO_METRES[from_unit]
    return metres / LENGTH_TO_METRES[to_unit]


# ── Temperature ───────────────────────────────────────────────────────────────
TEMP_UNITS = ['Celsius', 'Fahrenheit', 'Kelvin']


def convert_temperature(value, from_unit, to_unit):
    """
    Convert temperature between Celsius, Fahrenheit, and Kelvin.
    Converts to Celsius first as the base, then to the target.
    """
    value = float(value)
    # To Celsius
    if from_unit == 'Celsius':
        celsius = value
    elif from_unit == 'Fahrenheit':
        celsius = (value - 32) * 5 / 9
    elif from_unit == 'Kelvin':
        celsius = value - 273.15
    else:
        raise ValueError(f'Unknown temperature unit: {from_unit!r}')

    # From Celsius to target
    if to_unit == 'Celsius':
        return celsius
    elif to_unit == 'Fahrenheit':
        return celsius * 9 / 5 + 32
    elif to_unit == 'Kelvin':
        return celsius + 273.15
    else:
        raise ValueError(f'Unknown temperature unit: {to_unit!r}')


# ── Currency ──────────────────────────────────────────────────────────────────
# Static rates vs USD (approximate, July 2025)
CURRENCY_TO_USD = {
    'USD': 1.0,
    'EUR': 1.08,
    'GBP': 1.27,
    'INR': 0.012,
    'JPY': 0.0067,
    'CAD': 0.74,
    'AUD': 0.65,
    'CNY': 0.14,
    'CHF': 1.12,
    'BRL': 0.18,
}

CURRENCY_UNITS = list(CURRENCY_TO_USD.keys())


def convert_currency(value, from_unit, to_unit):
    """
    Convert currency using a static rate table (USD as base).
    Not suitable for real financial use — for educational demonstration only.
    """
    value = float(value)
    if from_unit not in CURRENCY_TO_USD or to_unit not in CURRENCY_TO_USD:
        raise ValueError(f'Unknown currency: {from_unit!r} or {to_unit!r}')
    in_usd = value * CURRENCY_TO_USD[from_unit]
    return in_usd / CURRENCY_TO_USD[to_unit]
