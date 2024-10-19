"""Tests for related industries functionality."""

import pandas as pd


def test1():
    fname = "tests/related-industries-qa-1.csv"
    df = pd.read_csv(fname)
    print()
    print(df)
