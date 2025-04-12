from modules.debias import get_video_bias
from dotenv import load_dotenv

load_dotenv('../.env')


video_transcript = """
Hello, this is a test video.
"""

ocr_content = """
Hello, this is a test video.
"""

bias = get_video_bias(video_transcript, ocr_content)
print(bias)