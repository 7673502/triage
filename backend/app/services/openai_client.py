from openai import AsyncOpenAI, OpenAIError
from pathlib import Path
import json
from app.core.config import get_settings
from app.models.schemas import ClassifiedPayload, BatchClassifiedPayload

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)

CLASSIFY_SINGLE_PROMPT_PATH = Path(__file__).parents[1] / 'prompts' / 'classify_single.txt'
CLASSIFY_SINGLE_PROMPT = CLASSIFY_SINGLE_PROMPT_PATH.read_text()

CLASSIFY_BATCH_PROMPT_PATH = Path(__file__).parents[1] / 'prompts' / 'classify_batch.txt'
CLASSIFY_BATCH_PROMPT = CLASSIFY_BATCH_PROMPT_PATH.read_text()

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
        response = await client.responses.parse(
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

async def classify_batch(requests: list[dict]) -> list[ClassifiedPayload]:
    model_input = [
        {'role': 'system', 'content': CLASSIFY_BATCH_PROMPT},
    ]

    for request in requests:
        next_input = {'role': 'user'}

        next_input['content'] = [{
            'type': 'input_text',
            'text': json.dumps(request, ensure_ascii=False, separators=(',', ':'))
        }]

        if 'media_url' in request:
            next_input['content'].append({
                'type': 'input_image',
                'image_url': request['media_url'],
                'detail': 'high'
            })

        model_input.append(next_input)

    try:
        response = await client.responses.parse(
            model='o4-mini',
            input=model_input,
            text_format=BatchClassifiedPayload
        )
        return response.output_parsed

    except OpenAIError as e:
        raise RuntimeError(f'OpenAI API error: {e}')
