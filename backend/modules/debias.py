import os
import json
import pprint
# import jsonl
import dotenv
from langchain.chat_models import AzureChatOpenAI  # This replaces ChatGoogleGenerativeAI
from langchain import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain.schema import HumanMessage  # For sending messages (if needed)
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from .serper import search_serper
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

PROMPT_FACT_CHECK_TEMPLATE = """
You are a politically unbiased assistant. In text below I will provide you with a transcript from a video in `VIDEO_TRANSCRIPT`.
Your task is find and return the statements that could be untrue or misleading.
Return ONLY  JSONL objects with the following structure:
{{
    "statement": <semantic segment that may be untrue>,
    "timestamp": <timestamp of the statement>,
    "thoughts": "<explanation>"
}}


The `VIDEO_TRANSCRIPT` is provided below. RETURN ONLY JSON, ALL YOUR THOUGHTS IN THE `thoughts` FIELD, DO NOT RETURN ANY OTHER TEXT.
VIDEO_TRANSCRIPT: {video_transcript}
"""

PROMPT_SUMMARY_TEMPLATE = """
You are a helpful assistant. In the text below I will provide you with a transcript from a video in `VIDEO_TRANSCRIPT`.
Your task is to summarize the video transcript and return a JSON object with the following structure:
{{
    "summary": <summary of the video transcript>,
}}
The `VIDEO_TRANSCRIPT` is provided below. RETURN ONLY JSON, ALL YOUR THOUGHTS IN THE `thoughts` FIELD, DO NOT RETURN ANY OTHER TEXT.
VIDEO_TRANSCRIPT: {video_transcript}
"""


# Prepare the prompt template with the actual input variable names.
prompt_bias = PromptTemplate(
    input_variables=["video_transcript", "ocr_content"],
    template=PROMPT_BIAS_TEMPLATE,
)

prompt_fact_check = PromptTemplate(
    input_variables=["video_transcript"],
    template=PROMPT_FACT_CHECK_TEMPLATE,
)

prompt_summary = PromptTemplate(
    input_variables=["video_transcript"],
    template=PROMPT_SUMMARY_TEMPLATE,
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

chain_fact_check = LLMChain(
    llm=llm,
    prompt=prompt_fact_check,
    # output_parser=parser_output,
    verbose=True,
)

chain_summary = LLMChain(
    llm=llm,
    prompt=prompt_summary,
    # output_parser=parser_output,
    verbose=True,
)

# Example inputs for the transcript and OCR content.

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


def get_video_fact_check(video_transcript: str) -> dict:
    """
    Function to get the political bias of a video using Azure OpenAI.
    
    Args:
        video_transcript (str): The transcript of the video.
        
    Returns:
        dict: The response from the Azure OpenAI model.
    """
    # Run the chain which will format the prompt, send it to your Azure model, and retrieve the response.
    response = chain_fact_check.run(video_transcript=video_transcript)
    # print("Response:", response)
    print("-"*50)
    # with open("/home/ivan/FRI/2024-2025/dh_2025/debias/backend/RESPONSE.txt", "w") as f:
    #     f.write(response)

    return parse_jsonl(response)
    # return [json.loads(line) for line in response.splitlines()]


def get_video_summary(video_transcript: str) -> dict:
    """
    Function to get the summary of a video using Azure OpenAI.
    """
    response = chain_summary.run(video_transcript=video_transcript)

    return json.loads(response)



def get_links_for_untrue(statements: list) -> list:
    """
    Function to get links for untrue statements.
    
    Args:
        statements (list): List of statements.
        
    Returns:
        list: List of links for untrue statements.
    """
    for statement in statements:
        # Use the Serper API to get links for each statement
        # For example, you can use the search_serper function defined earlier
        result = search_serper(statement["statement"])['organic'][0]
        print("Result:", result)
        title = result['title']
        link = result['link']
        statement["link"] = link
        statement["title"] = title
        # Process the result to extract links
        

    return statements

def get_summary(video_transcript: str) -> str:
    """
    Function to get a summary of the video transcript.
    
    Args:
        video_transcript (str): The transcript of the video.
        
    Returns:
        str: The summary of the video transcript.
    """
    response = chain_summary.run(video_transcript=video_transcript)
    return json.loads(response)



def rename_columns(data: list) -> list:
    """
    Function to rename columns in the data.
    
    Args:
        data (list): List of data.
        
    Returns:
        list: List of renamed data.
    """
    result = {}
    result['facts'] = []
    for item in data:
        item["claim"] = item.pop("statement")
        item["timestamp"] = item.pop("timestamp")
        item["correction"] = item.pop("thoughts")
        item["sourceUrl"] = item.pop("link")
        item["source"] = item.pop("title")
        result['facts'].append(item)
    return result


if __name__ == "__main__":
    video_transcript = "The speaker discusses the economic impacts of immigration policies on the middle class."
    ocr_content = "Make America Great Again"
    # Run the chain which will format the prompt, send it to your Azure model, and retrieve the response.
    # response = get_video_bias(video_transcript=video_transcript, ocr_content=ocr_content)
    # Print the response
    response = get_video_fact_check(video_transcript=video_transcript)
    
