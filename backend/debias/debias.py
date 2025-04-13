import os
import json
import pprint

import dotenv
from langchain.chat_models import AzureChatOpenAI  # This replaces ChatGoogleGenerativeAI
from langchain import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain.schema import HumanMessage  # For sending messages (if needed)
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

# Load environment variables (make sure AZURE_API_KEY is set in your environment)
print(dotenv.load_dotenv('.env'))

# Define your Pydantic model for the output
class PoliticalResultsModel(BaseModel):
    left: float = Field(
        description="The confidence level of how much the speaker is left-leaning. (0-1) as a float." 
    )
    right: float = Field(
        description="The confidence level of how much the speaker is right-leaning. (0-1) as a float."
    )
    center: float = Field(
        description="The confidence level of how much the speaker is centrist. (0-1) as a float."
    )
    neutral: float = Field(
        description="The confidence level of how much the speaker is neutral. (0-1) as a float."
    )
    thoughts: str = Field(
        description="Your thoughts on the speaker's political leaning."
    )
    final_answer: float = Field(
        description="Your final answer as a python floating point number. If you are not sure, use 0.5 here."
    )

# (Optional) Initialize the output parser so you can convert model output directly into your model.
parser_output = PydanticOutputParser(pydantic_object=PoliticalResultsModel)

# Define the prompt template using the provided transcript and OCR content.
PROMPT_BIAS_TEMPLATE = """
You are a politically unbiased assistant. In text below I will provide you with a transcript from a video in `VIDEO_TRANSCRIPT` 
and some OCR content from the video in `OCR_CONTENT`. Your task is to qualify the political bias if present and give a score from 0 to 10 for each of the following categories:
- Left
- Right
- Center
- Apolitical
Return a JSON object with the following structure:
{{
    "left": <score>,
    "right": <score>,
    "center": <score>,
    "neutral": <score>,
    "thoughts": "<explanation>"
}}

In the `thoughts` field, you should provide a short explanation of your reasoning. Think step by step and explain your reasoning.
The `VIDEO_TRANSCRIPT` and `OCR_CONTENT` are provided below. RETURN ONLY JSON, ALL YOUR THOUGHTS IN THE `thoughts` FIELD, DO NOT RETURN ANY OTHER TEXT.

VIDEO_TRANSCRIPT: {video_transcript}
OCR_CONTENT: {ocr_content}
"""

# Prepare the prompt template with the actual input variable names.
prompt_bias = PromptTemplate(
    input_variables=["video_transcript", "ocr_content"],
    template=PROMPT_BIAS_TEMPLATE,
)

# Initialize the AzureChatOpenAI model with your Azure credentials
llm = AzureChatOpenAI(
    deployment_name="gpt-4o-mini-2",  # Replace with your Azure deployment name
    openai_api_version="2024-12-01-preview",   # Your API version
    openai_api_base=os.getenv('AZURE_API_BASE'),  # Your endpoint
    openai_api_key=os.getenv("AZURE_API_KEY"),   # Your API key stored in your .env file
    temperature=0.1,
    # Optionally, you can provide additional parameters if needed.
)

# Set up the LangChain LLMChain with the prompt and the Azure LLM
chain_bias = LLMChain(
    llm=llm,
    prompt=prompt_bias,
    # output_parser=parser_output,
    verbose=True,
)

def parse_jsonl(jsonl_str: str):
    all_statmenes = []
    lines = jsonl_str.split('\n')
    for line in lines[1:-1]:
        line = line.strip()
        if not line:
            continue
        try:
            all_statmenes.append(json.loads(line))
        except json.JSONDecodeError:
            print(f"Invalid JSON: {line}")
            continue

    return all_statmenes

        # Process the valid JSON object here
        # For example, you can print it or save it to a file
        # print(line)

def get_video_fact_check(video_transcript: str, ocr_content:str="")-> dict:

    response = chain_bias.run(video_transcript=video_transcript, ocr_content=ocr_content)
    # Parse the JSON response
    parsed_response = parse_jsonl(response)
    print(parsed_response)
    return parsed_response



def get_video_bias(video_transcript: str, ocr_content:str="")-> dict:
    """
    Function to get the political bias of a video using Azure OpenAI.
    
    Args:
        video_transcript (str): The transcript of the video.
        ocr_content (str): The OCR content from the video.
        
    Returns:
        dict: The response from the Azure OpenAI model.
    """
    # Run the chain which will format the prompt, send it to your Azure model, and retrieve the response.
    response = chain_bias.run(video_transcript=video_transcript, ocr_content=ocr_content)
    
    return json.loads(response)


if __name__ == "__main__":
    video_transcript = "The speaker discusses the economic impacts of immigration policies on the middle class."
    ocr_content = "Make America Great Again"
    # Run the chain which will format the prompt, send it to your Azure model, and retrieve the response.
    # response = get_video_bias(video_transcript=video_transcript, ocr_content=ocr_content)
    # Print the response
    # print(response)
