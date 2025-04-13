from flask import Flask
from flask import Flask, request, jsonify


from modules.dlp_functions import download_audio
from modules.transcription_subtitles import get_transcript_with_sentence_timestamps
from modules.debias import get_video_bias, get_video_fact_check, get_links_for_untrue, rename_columns
from modules.serper import search_serper
from dotenv import load_dotenv

load_dotenv('.env')

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello, Flask!"


@app.route('/process_video', methods=['POST'])
def process_video():
    """
    Endpoint to process a YouTube video.
    Expects a JSON payload with a 'video_url' key.
    """
    try:
        data = request.get_json()
        if not data or 'video_url' not in data:
            return jsonify({"error": "Missing 'video_url' parameter"}), 400
        
        video_url = data['video_url']
        
        # Step 1: Download audio from the YouTube video.
        audio_file_path = download_audio(video_url, output_path='./audio')
        print(f"Audio downloaded to: {audio_file_path}")
        # Step 2: Transcribe the audio to get sentences with timestamps.
        transcript = get_transcript_with_sentence_timestamps(audio_file_path)
        print(f"Transcript: {transcript}")
        # Step 3: Analyze the transcript for bias.
        bias_results = get_video_bias(transcript)
        
        # Step 4: Run fact-checking on the transcript.
        fact_check_results = get_video_fact_check(transcript)
        untrue_with_links = get_links_for_untrue(fact_check_results)
        untrue_with_links = rename_columns(untrue_with_links)

        response = {
            "bias": bias_results,
            "facts": untrue_with_links,    
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_bias', methods=['POST'])
def get_bias():
    try:
        data = request.get_json()
        if not data or 'video_url' not in data:
            return jsonify({"error": "Missing 'video_url' parameter"}), 400
        
        video_url = data['video_url']
        
        # Step 1: Download audio from the YouTube video.
        audio_file_path = download_audio(video_url, output_path='./audio')
        print(f"Audio downloaded to: {audio_file_path}")
        # Step 2: Transcribe the audio to get sentences with timestamps.
        transcript = get_transcript_with_sentence_timestamps(audio_file_path)

        # Step 3: Analyze the transcript for bias.
        bias_results = get_video_bias(transcript)
        
        response = {
            "bias": bias_results,    
        }
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(response)

    

if __name__ == '__main__':
    app.run(debug=True)