from pydantic import BaseModel, conint
from .enums import RequestFlag

class ClassifiedPayload(BaseModel):
    priority: conint(ge=0, le=100)
    flag: list[RequestFlag]
    priority_explanation: str
    flag_explanation: str

class ClassifiedResponse(BaseModel):
    id: str
    payload: ClassifiedPayload
