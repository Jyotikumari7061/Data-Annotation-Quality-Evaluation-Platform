from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import csv
import io
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="AI Content Quality Evaluation API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums for annotation
class QualityLevel(str, Enum):
    GOOD = "good"
    AVERAGE = "average"
    POOR = "poor"

class IssueTag(str, Enum):
    GRAMMAR_ERROR = "grammar_error"
    IRRELEVANT_CONTENT = "irrelevant_content"
    HARMFUL_UNSAFE = "harmful_unsafe"
    INCOMPLETE_TRUNCATED = "incomplete_truncated"

# Pydantic Models
class TextSample(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    source: Optional[str] = None
    topic: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TextSampleCreate(BaseModel):
    text: str
    source: Optional[str] = None
    topic: Optional[str] = None

class Annotation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text_sample_id: str
    quality_level: QualityLevel
    issue_tags: List[IssueTag] = []
    notes: Optional[str] = None
    annotator_id: Optional[str] = "default"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnnotationCreate(BaseModel):
    text_sample_id: str
    quality_level: QualityLevel
    issue_tags: List[IssueTag] = []
    notes: Optional[str] = None
    annotator_id: Optional[str] = "default"

class PairwiseComparison(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text_a_id: str
    text_b_id: str
    better_text_id: str
    annotator_id: Optional[str] = "default"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PairwiseComparisonCreate(BaseModel):
    text_a_id: str
    text_b_id: str
    better_text_id: str
    annotator_id: Optional[str] = "default"
    notes: Optional[str] = None

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Helper functions
def prepare_for_mongo(data: dict) -> dict:
    """Prepare data for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    return data

def parse_from_mongo(item: dict) -> dict:
    """Parse data from MongoDB"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    return item

# Text Sample Routes
@api_router.post("/text-samples", response_model=TextSample)
async def create_text_sample(sample: TextSampleCreate):
    sample_dict = sample.dict()
    sample_obj = TextSample(**sample_dict)
    sample_dict = prepare_for_mongo(sample_obj.dict())
    await db.text_samples.insert_one(sample_dict)
    return sample_obj

@api_router.get("/text-samples", response_model=List[TextSample])
async def get_text_samples(skip: int = 0, limit: int = 100):
    samples = await db.text_samples.find().skip(skip).limit(limit).to_list(length=None)
    return [TextSample(**parse_from_mongo(sample)) for sample in samples]

@api_router.get("/text-samples/{sample_id}", response_model=TextSample)
async def get_text_sample(sample_id: str):
    sample = await db.text_samples.find_one({"id": sample_id})
    if not sample:
        raise HTTPException(status_code=404, detail="Text sample not found")
    return TextSample(**parse_from_mongo(sample))

@api_router.delete("/text-samples/{sample_id}")
async def delete_text_sample(sample_id: str):
    result = await db.text_samples.delete_one({"id": sample_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Text sample not found")
    return {"message": "Text sample deleted successfully"}

# Annotation Routes
@api_router.post("/annotations", response_model=Annotation)
async def create_annotation(annotation: AnnotationCreate):
    # Check if text sample exists
    sample = await db.text_samples.find_one({"id": annotation.text_sample_id})
    if not sample:
        raise HTTPException(status_code=404, detail="Text sample not found")
    
    annotation_dict = annotation.dict()
    annotation_obj = Annotation(**annotation_dict)
    annotation_dict = prepare_for_mongo(annotation_obj.dict())
    await db.annotations.insert_one(annotation_dict)
    return annotation_obj

@api_router.get("/annotations", response_model=List[Annotation])
async def get_annotations(skip: int = 0, limit: int = 100):
    annotations = await db.annotations.find().skip(skip).limit(limit).to_list(length=None)
    return [Annotation(**parse_from_mongo(annotation)) for annotation in annotations]

@api_router.get("/annotations/text-sample/{sample_id}", response_model=List[Annotation])
async def get_annotations_by_sample(sample_id: str):
    annotations = await db.annotations.find({"text_sample_id": sample_id}).to_list(length=None)
    return [Annotation(**parse_from_mongo(annotation)) for annotation in annotations]

# Pairwise Comparison Routes
@api_router.post("/pairwise-comparisons", response_model=PairwiseComparison)
async def create_pairwise_comparison(comparison: PairwiseComparisonCreate):
    # Verify text samples exist
    sample_a = await db.text_samples.find_one({"id": comparison.text_a_id})
    sample_b = await db.text_samples.find_one({"id": comparison.text_b_id})
    if not sample_a or not sample_b:
        raise HTTPException(status_code=404, detail="One or both text samples not found")
    
    comparison_dict = comparison.dict()
    comparison_obj = PairwiseComparison(**comparison_dict)
    comparison_dict = prepare_for_mongo(comparison_obj.dict())
    await db.pairwise_comparisons.insert_one(comparison_dict)
    return comparison_obj

@api_router.get("/pairwise-comparisons", response_model=List[PairwiseComparison])
async def get_pairwise_comparisons(skip: int = 0, limit: int = 100):
    comparisons = await db.pairwise_comparisons.find().skip(skip).limit(limit).to_list(length=None)
    return [PairwiseComparison(**parse_from_mongo(comparison)) for comparison in comparisons]

# Random pair for pairwise comparison
@api_router.get("/text-samples/random-pair")
async def get_random_pair():
    # Get two random samples for comparison
    samples = await db.text_samples.aggregate([
        {"$sample": {"size": 2}}
    ]).to_list(length=None)
    
    if len(samples) < 2:
        raise HTTPException(status_code=404, detail="Not enough text samples for pairwise comparison")
    
    return [TextSample(**parse_from_mongo(sample)) for sample in samples]

# Analytics and Statistics
@api_router.get("/analytics/summary")
async def get_analytics_summary():
    total_samples = await db.text_samples.count_documents({})
    total_annotations = await db.annotations.count_documents({})
    total_comparisons = await db.pairwise_comparisons.count_documents({})
    
    # Quality level distribution
    quality_distribution = {}
    for level in QualityLevel:
        count = await db.annotations.count_documents({"quality_level": level.value})
        quality_distribution[level.value] = count
    
    # Issue tags distribution
    issue_distribution = {}
    for tag in IssueTag:
        count = await db.annotations.count_documents({"issue_tags": {"$in": [tag.value]}})
        issue_distribution[tag.value] = count
    
    return {
        "total_samples": total_samples,
        "total_annotations": total_annotations,
        "total_comparisons": total_comparisons,
        "quality_distribution": quality_distribution,
        "issue_distribution": issue_distribution,
        "annotation_progress": f"{total_annotations}/{total_samples}" if total_samples > 0 else "0/0"
    }

# Import/Upload Routes
@api_router.post("/text-samples/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    csv_data = csv.DictReader(io.StringIO(content.decode('utf-8')))
    
    samples_created = 0
    for row in csv_data:
        if 'text' in row and row['text'].strip():
            sample = TextSampleCreate(
                text=row['text'],
                source=row.get('source'),
                topic=row.get('topic')
            )
            sample_obj = TextSample(**sample.dict())
            sample_dict = prepare_for_mongo(sample_obj.dict())
            await db.text_samples.insert_one(sample_dict)
            samples_created += 1
    
    return {"message": f"Successfully uploaded {samples_created} text samples"}

@api_router.post("/text-samples/upload-json")
async def upload_json(file: UploadFile = File(...)):
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be JSON")
    
    content = await file.read()
    json_data = json.loads(content.decode('utf-8'))
    
    samples_created = 0
    if isinstance(json_data, list):
        for item in json_data:
            if 'text' in item and item['text'].strip():
                sample = TextSampleCreate(
                    text=item['text'],
                    source=item.get('source'),
                    topic=item.get('topic')
                )
                sample_obj = TextSample(**sample.dict())
                sample_dict = prepare_for_mongo(sample_obj.dict())
                await db.text_samples.insert_one(sample_dict)
                samples_created += 1
    
    return {"message": f"Successfully uploaded {samples_created} text samples"}

# Export Routes
@api_router.get("/export/annotations-csv")
async def export_annotations_csv():
    annotations = await db.annotations.find().to_list(length=None)
    
    # Create CSV content
    output = io.StringIO()
    fieldnames = ['id', 'text_sample_id', 'quality_level', 'issue_tags', 'notes', 'annotator_id', 'created_at']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for annotation in annotations:
        annotation_data = parse_from_mongo(annotation)
        annotation_data['issue_tags'] = ','.join(annotation_data['issue_tags'])
        annotation_data['created_at'] = annotation_data['created_at'].isoformat()
        writer.writerow(annotation_data)
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        headers={"Content-Disposition": "attachment; filename=annotations.csv"}
    )

@api_router.get("/export/full-dataset-csv")
async def export_full_dataset_csv():
    # Join text samples with their annotations
    pipeline = [
        {
            "$lookup": {
                "from": "annotations",
                "localField": "id",
                "foreignField": "text_sample_id",
                "as": "annotations"
            }
        }
    ]
    
    results = await db.text_samples.aggregate(pipeline).to_list(length=None)
    
    output = io.StringIO()
    fieldnames = ['sample_id', 'text', 'source', 'topic', 'quality_level', 'issue_tags', 'notes', 'created_at']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for result in results:
        sample_data = parse_from_mongo(result)
        if sample_data['annotations']:
            for annotation in sample_data['annotations']:
                annotation_data = parse_from_mongo(annotation)
                row = {
                    'sample_id': sample_data['id'],
                    'text': sample_data['text'],
                    'source': sample_data.get('source', ''),
                    'topic': sample_data.get('topic', ''),
                    'quality_level': annotation_data['quality_level'],
                    'issue_tags': ','.join(annotation_data['issue_tags']),
                    'notes': annotation_data.get('notes', ''),
                    'created_at': sample_data['created_at'].isoformat()
                }
                writer.writerow(row)
        else:
            # Sample without annotation
            row = {
                'sample_id': sample_data['id'],
                'text': sample_data['text'],
                'source': sample_data.get('source', ''),
                'topic': sample_data.get('topic', ''),
                'quality_level': '',
                'issue_tags': '',
                'notes': '',
                'created_at': sample_data['created_at'].isoformat()
            }
            writer.writerow(row)
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        headers={"Content-Disposition": "attachment; filename=full_dataset.csv"}
    )

# Initialize sample data
@api_router.post("/initialize-sample-data")
async def initialize_sample_data():
    # Check if we already have samples
    existing_count = await db.text_samples.count_documents({})
    if existing_count > 0:
        return {"message": f"Sample data already exists ({existing_count} samples)"}
    
    sample_texts = [
        {
            "text": "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet at least once.",
            "topic": "Grammar Example",
            "source": "Demo"
        },
        {
            "text": "Artificial intelligence has revolutionized many industries, from healthcare to autonomous vehicles, enabling unprecedented levels of automation and efficiency.",
            "topic": "Technology",
            "source": "Demo"
        },
        {
            "text": "Climate change is one of the most pressing issues of our time, requiring immediate global action to reduce greenhouse gas emissions and transition to renewable energy sources.",
            "topic": "Environment",
            "source": "Demo"
        },
        {
            "text": "The recipe for chocolate cake requires flour, sugar, eggs, and cocoa powder. Mix ingredients and bake at 350 degrees for 30 minutes.",
            "topic": "Cooking",
            "source": "Demo"
        },
        {
            "text": "Shakespeare wrote many famous plays including Hamlet, Romeo and Juliet, and Macbeth during the Elizabethan era of English literature.",
            "topic": "Literature",
            "source": "Demo"
        },
        {
            "text": "The stock market experienced significant volatility last week due to concerns about inflation and interest rate changes announced by the Federal Reserve.",
            "topic": "Finance",
            "source": "Demo"
        },
        {
            "text": "Regular exercise is essential for maintaining good health. It helps strengthen muscles, improve cardiovascular function, and boost mental wellbeing.",
            "topic": "Health",
            "source": "Demo"
        },
        {
            "text": "The new smartphone features include a 48-megapixel camera, 5G connectivity, and a battery life of up to 24 hours under normal usage conditions.",
            "topic": "Technology",
            "source": "Demo"
        },
        {
            "text": "Education is the foundation of personal growth and societal development. It empowers individuals to think critically and contribute meaningfully to their communities.",
            "topic": "Education",
            "source": "Demo"
        },
        {
            "text": "The museum's new exhibition showcases ancient artifacts from Egyptian civilization, including pottery, jewelry, and hieroglyphic inscriptions dating back 3000 years.",
            "topic": "History",
            "source": "Demo"
        },
        # Some samples with intentional issues for annotation practice
        {
            "text": "Their going to the store later today and they're planning to buy some grocerys for dinner tonight.",
            "topic": "Grammar Practice",
            "source": "Demo"
        },
        {
            "text": "The capital of France is Berlin and it's known for the Eiffel Tower and delicious pasta dishes.",
            "topic": "Geography",
            "source": "Demo"
        },
        {
            "text": "Water boils at 100 degrees Celsius at sea level atmospheric pressure which equals",
            "topic": "Science",
            "source": "Demo"
        },
        {
            "text": "To make a paper airplane, first take a rectangular piece of paper and fold it in half lengthwise.",
            "topic": "Instructions",
            "source": "Demo"
        },
        {
            "text": "The movie was absolutely terrible and boring. I hated every minute of it and would never recommend it to anyone.",
            "topic": "Movie Review",
            "source": "Demo"
        }
    ]
    
    samples_created = 0
    for sample_data in sample_texts:
        sample = TextSample(**sample_data)
        sample_dict = prepare_for_mongo(sample.dict())
        await db.text_samples.insert_one(sample_dict)
        samples_created += 1
    
    return {"message": f"Successfully created {samples_created} sample text entries"}

# Original status routes
@api_router.get("/")
async def root():
    return {"message": "AI Content Quality Evaluation API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    status_dict = prepare_for_mongo(status_obj.dict())
    await db.status_checks.insert_one(status_dict)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**parse_from_mongo(status_check)) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()