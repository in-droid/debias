from modules.debias import get_video_bias, get_video_fact_check, get_links_for_untrue, rename_columns
from modules.serper import search_serper
from dotenv import load_dotenv
import json

load_dotenv('../.env')


video_transcript = """
Hello, this is a test video.
"""

ocr_content = """
"""

PATH_TRANSCRIPT = "/home/ivan/FRI/2024-2025/dh_2025/debias/transcript/transcript_timestamps.txt"
with open(PATH_TRANSCRIPT, 'r') as file:
    video_transcript = file.read()


# bias = get_video_bias(video_transcript, ocr_content)
# print(bias)
# video_fact_check = get_video_bias(video_transcript)


# video_fact_check = get_video_fact_check(video_transcript)

with open('/home/ivan/FRI/2024-2025/dh_2025/debias/transcript/fact_check.jsonl', 'r') as f:
    video_fact_check = [json.loads(line) for line in f]


untrue_with_links = get_links_for_untrue(video_fact_check)
untrue_with_links = rename_columns(untrue_with_links)

# with open('/home/ivan/FRI/2024-2025/dh_2025/debias/transcript/untrue_with_links_RENAMED.jsonl', 'w') as f:
#     for item in untrue_with_links:
#         f.write(json.dumps(item) + "\n")

with open('/home/ivan/FRI/2024-2025/dh_2025/debias/transcript/untrue_with_links_RENAMED.json', 'w') as f:
    json.dump(untrue_with_links, f, indent=4)




    #   f.write("\n")
# print(video_fact_check)

