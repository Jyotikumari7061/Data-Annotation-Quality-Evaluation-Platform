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
