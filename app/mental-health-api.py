import requests
import json

url = "https://health.gov/myhealthfinder/api/v3/topicsearch.json?categoryId=109"
headers = {"Content-Type": "application/json"}

response = requests.get(url, headers=headers)
data = response.json()
print(data)
# if response.status_code == 200:
#     try:
#     except requests.exceptions.JSONDecodeError:
#         print("Response content is not valid JSON")
#         print("Raw content:", response.text)
# else:
#     print(f"Request failed with status code {response.status_code}")
#     print("Response content:", response.text)
