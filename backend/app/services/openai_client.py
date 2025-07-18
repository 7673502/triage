from openai import OpenAI, OpenAIError
from pathlib import Path
import json
from app.core.config import get_settings
from app.models.schemas import ClassifiedPayload

settings = get_settings()
client = OpenAI(api_key=settings.openai_api_key)

PROMPT_PATH = Path(__file__).parents[1] / 'prompts' / 'classify_single.txt'
CLASSIFY_SINGLE_PROMPT = PROMPT_PATH.read_text()

async def classify_single(request: dict) -> ClassifiedPayload:
    user_parts = [{
        'type': 'input_text',
        'text': json.dumps(request, ensure_ascii=False, separators=(',', ':'))
    }]

    if 'media_url' in request:
        user_parts.append({
            'type': 'input_image',
            'image_url': request['media_url'],
            'detail': 'high'
        })

    try:
        response = await client.response.parse(
            model='o4-mini',
            input=[
                {'role': 'system', 'content': CLASSIFY_SINGLE_PROMPT},
                {'role': 'user', 'content': user_parts}
            ],
            text_format=ClassifiedPayload   
        )
        return response.output_parsed
    except OpenAIError as e:
        raise RuntimeError(f'OpenAI API error: {e}')
