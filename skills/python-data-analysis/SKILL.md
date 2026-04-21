---
name: python-data-analysis
description: Perform data analysis with Python using pandas, NumPy, and visualization libraries. Clean data, compute statistics, and create informative charts for analytics workflows.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: analytics
  tags:
    - python
    - pandas
    - numpy
    - data-analysis
    - visualization
    - analytics
  personas:
    developer: 60
    researcher: 70
    analyst: 95
    operator: 40
    creator: 45
    support: 30
  summary: Master data analysis with pandas, NumPy, and visualization for analytics workflows
  featured: false
  requires:
    tools: [file-read, command-exec]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Python Data Analysis

pandas and NumPy form the foundation of Python data analysis. This skill covers common analytics workflows.

## Setup

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Display settings
pd.set_option('display.max_columns', 20)
pd.set_option('display.width', 200)
```

## Data Loading

```python
# CSV
df = pd.read_csv('data.csv')

# Excel
df = pd.read_excel('data.xlsx', sheet_name='Sheet1')

# SQL
df = pd.read_sql('SELECT * FROM users', connection)

# JSON
df = pd.read_json('data.json')

# URL
df = pd.read_csv('https://example.com/data.csv')
```

## Data Inspection

```python
df.head()           # First 5 rows
df.tail()           # Last 5 rows
df.shape             # (rows, columns)
df.info()            # Types and nulls
df.describe()        # Statistical summary
df.columns           # Column names
df.dtypes            # Data types
```

## Data Cleaning

```python
# Remove duplicates
df = df.drop_duplicates()

# Handle missing values
df.dropna()                      # Remove rows with NaN
df.fillna(0)                     # Fill with value
df['column'].fillna(df['column'].mean())  # Fill with mean

# Type conversion
df['date'] = pd.to_datetime(df['date'])
df['amount'] = pd.to_numeric(df['amount'])

# String operations
df['name'] = df['name'].str.strip()
df['email'] = df['email'].str.lower()
```

## Filtering

```python
# Single condition
df[df['age'] > 30]

# Multiple conditions
df[(df['age'] > 30) & (df['city'] == 'NYC')]

# Using query
df.query('age > 30 and city == "NYC"')

# Is in
df[df['status'].isin(['active', 'pending'])]
```

## Aggregations

```python
# Group by and aggregate
df.groupby('city')['amount'].sum()
df.groupby('city').agg({'amount': 'sum', 'age': 'mean'})
df.groupby('city').agg(
    total=('amount', 'sum'),
    average=('amount', 'mean'),
    count=('id', 'count')
)
```

## Pivoting

```python
# Pivot table
pd.pivot_table(
    df,
    values='amount',
    index='city',
    columns='month',
    aggfunc='sum',
    fill_value=0
)
```

## Time Series

```python
# Date filtering
df['date'] = pd.to_datetime(df['date'])
df.set_index('date', inplace=True)

# Resample
df.resample('M')['amount'].sum()     # Monthly
df.resample('W')['amount'].mean()    # Weekly
df.resample('D')['amount'].sum()      # Daily

# Rolling averages
df['rolling_7d'] = df['amount'].rolling(window=7).mean()
df['rolling_30d'] = df['amount'].rolling(window=30).mean()
```

## Visualization

```python
# Line chart
df.plot(x='date', y='amount', kind='line')

# Bar chart
df.groupby('category')['amount'].sum().plot(kind='bar')

# Histogram
df['age'].hist(bins=30)

# Scatter
df.plot(x='income', y='spending', kind='scatter')

# Seaborn
sns.histplot(data=df, x='amount', hue='category', kde=True)
sns.boxplot(data=df, x='category', y='amount')
sns.heatmap(df.corr(), annot=True)
```

## Statistics

```python
# Descriptive stats
df['amount'].mean()        # Average
df['amount'].median()      # Median
df['amount'].std()         # Standard deviation
df['amount'].quantile(0.75)  # 75th percentile

# Correlation
df.corr()
```

## Export

```python
# CSV
df.to_csv('output.csv', index=False)

# Excel with formatting
with pd.ExcelWriter('output.xlsx') as writer:
    df.to_excel(writer, sheet_name='Data')
    
# SQL
df.to_sql('table_name', connection, if_exists='replace', index=False)
```

## Common Patterns

### Top N per Group

```python
df.groupby('category').apply(
    lambda x: x.nlargest(5, 'amount')
).reset_index(drop=True)
```

### Cumulative Sum

```python
df['cumulative'] = df.groupby('category')['amount'].cumsum()
```

### Percentage of Total

```python
df['percentage'] = df['amount'] / df.groupby('category')['amount'].transform('sum') * 100
```
