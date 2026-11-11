import pandas as pd

# Creating a manual dataset
data = pd.DataFrame({
    'name': ['Mark', 'Sarah', 'David', 'Mark', None],
    'age': [28, 34, None, 28, 22],
    'purchase_amount': [100.5, None, 85.3, 100.5, 50.0],
    'date_of_purchase': ['2024/01/15', '2024/01/16', '2024/01/15', '2024/01/15', '2024/01/17']
})

print(data)

# Removing duplicate rows
data = data.drop_duplicates()

print(data)

# Correcting inconsistent date formats
data['date_of_purchase'] = pd.to_datetime(
    data['date_of_purchase'], 
    errors='coerce'
)

print(data)