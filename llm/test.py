import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain import LLMChain
from langchain.schema import HumanMessage  # Uncommented this
import dotenv
from langchain_core.output_parsers import (
    PydanticOutputParser
)

dotenv.load_dotenv('../.env')


from pydantic import BaseModel, Field

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


parser_output = PydanticOutputParser(pydantic_object=PoliticalResultsModel)
# Define the prompt template



PROMPT_LMM = """
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

# Load API key
GEMMA_TOKEN = os.getenv("GEMMA_TOKEN")

# Prepare the prompt template
prompt = PromptTemplate(
    input_variables=["video_transcript", "ocr_content"],
    template=PROMPT_LMM,
)

# Initialize the model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key='AIzaSyBzW4RMOMkUjb57nNQoCpLVh8cYjag6NmY',
    temperature=0.1,
    generation_config={
        'response_mime_type': 'application/json',
    }
)

# Example inputs
video_transcript = "The speaker discusses the economic impacts of immigration policies on the middle class."
ocr_content = "Make America Great Again"

# Format the prompt with actual content
formatted_prompt = prompt.format(
    video_transcript=video_transcript,
    ocr_content=ocr_content
)

# Send prompt to the model
# response = llm.invoke([
#     HumanMessage(content=formatted_prompt)
# ])
chain = LLMChain(
    llm=llm,
    prompt=prompt,
    # output_parser=parser_output,
    verbose=True,
)

# Run the chain with your inputs. The chain will format the prompt,
# send it to the model, and parse the JSON response into PoliticalResultsModel.
response = chain.run(video_transcript=video_transcript, ocr_content=ocr_content)

# response = chain.invoke({'video_transcript': video_transcript, 'ocr_content': ocr_content})

print("Gemini:", response.content)
