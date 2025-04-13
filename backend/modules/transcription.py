import requests

# Replace with your actual Groq API key
API_KEY = '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'
# The endpoint might differ depending on Groq's setup
GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'


def transcribe_audio(file_path):
    headers = {
        'Authorization': f'Bearer {API_KEY}',
    }

    files = {
        'file': open(file_path, 'rb'),
        'model': (None, 'whisper-large-v3'),  # or the correct Whisper model you want
        'response_format': (None, 'text'),
    }

    response = requests.post(GROQ_API_URL, headers=headers, files=files)

    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Error {response.status_code}: {response.text}")

# Example usage:
if __name__ == "__main__":
    file_path = "/home/ivan/FRI/2024-2025/dh_2025/debias/audio/Trump's Speech Highlights： The Least And Most Taxed Countries By Trump.mp3"  # or .wav, .m4a etc.
    transcript = transcribe_audio(file_path)
    output_file_path = '/home/ivan/FRI/2024-2025/dh_2025/debias/transcript/transcript.txt'
    with open(output_file_path, 'w') as f:
        f.write(transcript)
    print(f"Transcript saved to {output_file_path}")
    print("Transcript:", transcript)
