import requests

# Put your Serper.dev API key here
SERPER_API_KEY = '73f8ec8cacbccc3b8551ead6458ad2f714134ec4'

def search_serper(query):
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "q": query
    }

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        print("Error:", response.status_code, response.text)
        return None

# Example usage:
if __name__ == "__main__":
    claim = input("Enter a claim to fact-check: ")

    search_results = search_serper(claim)

    if search_results:
        print("\nTop Results:")
        for idx, result in enumerate(search_results.get('organic', []), start=1):
            print(f"{idx}. {result['title']}")
            print(result['link'])
            print(result['snippet'])
            print("-" * 50)
    else:
        print("No results found.")
