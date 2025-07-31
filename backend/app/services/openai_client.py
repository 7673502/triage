import sys
import logging
import openai
from openai import AsyncOpenAI
from pathlib import Path
import asyncio
import json
import backoff
from app.core.config import get_settings
from app.models.schemas import ClassifiedPayload, BatchClassifiedPayload

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO
)
log = logging.getLogger('openai-client')

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

def _build_model_input(
    requests: list[dict],
    include_images: bool = True
) -> list[dict]:
    model_input = [
        {'role': 'system', 'content': CLASSIFY_BATCH_PROMPT},
    ]

    for request in requests:
        next_input = {'role': 'user'}

        next_input['content'] = [{
            'type': 'input_text',
            'text': json.dumps(request, ensure_ascii=False, separators=(',', ':'))
        }]

        if include_images and 'media_url' in request and isinstance(request['media_url'], str) and request['media_url'].startswith('https'):
            next_input['content'].append({
                'type': 'input_image',
                'image_url': request['media_url'],
                'detail': 'low'
            })

        model_input.append(next_input)
    
    return model_input



@backoff.on_exception(
    backoff.expo,
    TRANSIENT_ERRORS,
    jitter=backoff.full_jitter
)
async def classify_batch(requests: list[dict]) -> list[ClassifiedPayload]:
    model_input = _build_model_input(requests)

    for model_idx, model in enumerate(settings.models):
        try:
            response = await client.responses.parse(
                model=model,
                input=model_input,
                text_format=BatchClassifiedPayload
            )
            return response.output_parsed.requests

        # handle bad image urls
        except openai.BadRequestError as e:
            if e.body['param'] == 'url' and e.body['code'] == 'invalid_value':
                try:
                    model_input_imageless = _build_model_input(requests, include_images=False)

                    response = await client.responses.parse(
                        model=model,
                        input=model_input_imageless,
                        text_format=BatchClassifiedPayload
                    )
                    return response.output_parsed.requests
                except openai.RateLimitError:
                    if model_idx == len(settings.models) - 1:
                        raise
                    continue
            else:
                raise

        except openai.RateLimitError:
            if model_idx == len(settings.models) - 1:
                raise
            log.info('RateLimitError occurred; switching from %s to %s', settings.models[model_idx], settings.models[model_idx+1])
            continue

async def classify_batch_in_chunks(requests: list[dict], chunk_size: int = 5) -> list[ClassifiedPayload]:
    outputs = []

    for i in range(0, len(requests), chunk_size):
        outputs += await classify_batch(requests[i : i + chunk_size])
        await asyncio.sleep(settings.poll_interval)

    return outputs
