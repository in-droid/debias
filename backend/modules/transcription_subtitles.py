import requests

# Replace with your actual Groq API key
API_KEY = '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'
GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'


def transcribe_audio(file_path):
    headers = {
        'Authorization': f'Bearer {API_KEY}',
    }

    files = {
        'file': open(file_path, 'rb'),
        'model': (None, 'whisper-large-v3'),  # or the correct Whisper model you want
        'response_format': (None, 'verbose_json'),  # <-- Request JSON structure
    }

    response = requests.post(GROQ_API_URL, headers=headers, files=files)

    if response.status_code == 200:
        return response.json()  # <-- Parse JSON instead of returning plain text
    else:
        raise Exception(f"Error {response.status_code}: {response.text}")


def format_timestamp(seconds):
    # Convert seconds to hh:mm:ss format
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02}:{minutes:02}:{secs:02}"


def merge_segments_into_sentences(segments):
    sentences = []
    current_sentence = ""
    start_time = None
    end_time = None

    for segment in segments:
        text = segment['text'].strip()
        if not text:
            continue

        if start_time is None:
            start_time = segment['start']

        current_sentence += " " + text
        end_time = segment['end']

        # Check if the segment ends with a logical punctuation
        if text.endswith(('.', '?', '!')):
            sentences.append({
                'start': start_time,
                'end': end_time,
                'text': current_sentence.strip()
            })
            # Reset for next sentence
            current_sentence = ""
            start_time = None
            end_time = None

    # In case there's leftover text without punctuation
    if current_sentence:
        sentences.append({
            'start': start_time,
            'end': end_time,
            'text': current_sentence.strip()
        })

    return sentences


def get_transcript_with_sentence_timestamps(file_path):
    data = transcribe_audio(file_path)
    segments = data.get('segments', [])
    sentences = merge_segments_into_sentences(segments)

    transcript_with_timestamps = []

    for sentence in sentences:
        start = format_timestamp(sentence['start'])
        end = format_timestamp(sentence['end'])
        text = sentence['text']
        transcript_with_timestamps.append(f"[{start} - {end}] {text}")

    return transcript_with_timestamps


# Example usage
if __name__ == "__main__":
    file_path = "/home/ivan/FRI/2024-2025/dh_2025/debias/audio/Trump's Speech Highlights： The Least And Most Taxed Countries By Trump.mp3"

    transcript_with_sentences = get_transcript_with_sentence_timestamps(file_path)

    with open('/home/ivan/FRI/2024-2025/dh_2025/debias/transcript/transcript_timestamps.txt', 'w') as f:
        for line in transcript_with_sentences:
            f.write(line + "\n")

    print("\nTranscript with Logical Sentences and Timestamps:\n")
    for line in transcript_with_sentences:
        print(line)