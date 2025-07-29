from openai import AsyncOpenAI
import openai
from pathlib import Path
import asyncio
import json
import backoff
from app.core.config import get_settings
from app.models.schemas import ClassifiedPayload, BatchClassifiedPayload

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)

CLASSIFY_BATCH_PROMPT_PATH = Path(__file__).parents[1] / 'prompts' / 'classify_batch.txt'
CLASSIFY_BATCH_PROMPT = CLASSIFY_BATCH_PROMPT_PATH.read_text()

TRANSIENT_ERRORS = (
    openai.APIConnectionError,
    openai.APITimeoutError,
    openai.InternalServerError,
    openai.RateLimitError
)

@backoff.on_exception(
    backoff.expo,
    TRANSIENT_ERRORS,
    jitter=backoff.full_jitter
)
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

        if 'media_url' in request and isinstance(request['media_url'], str) and request['media_url'].startswith('http'):
            next_input['content'].append({
                'type': 'input_image',
                'image_url': request['media_url'],
                'detail': 'low'
            })

        model_input.append(next_input)

    try:
        response = await client.responses.parse(
            model='o4-mini',
            input=model_input,
            text_format=BatchClassifiedPayload
        )

    # handle bad image urls
    except openai.BadRequestError as e:
        if e.body['param'] == 'url' and e.body['code'] == 'invalid_value':
            for i in range(len(model_input)):
                if model_input[i]['role'] == 'system':
                    continue
                if len(model_input[i]['content']) == 2: # image is always second index of input content
                    model_input[i]['content'].pop()

        response = await client.responses.parse(
            model='o4-mini',
            input=model_input,
            text_format=BatchClassifiedPayload
        )

    return response.output_parsed.requests

async def classify_batch_in_chunks(requests: list[dict], chunk_size: int = 5) -> list[ClassifiedPayload]:
    outputs = []

    for i in range(0, len(requests), chunk_size):
        outputs += await classify_batch(requests[i : i + chunk_size])
        await asyncio.sleep(settings.poll_interval)

    return outputs

