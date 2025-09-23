# Random pair for pairwise comparison
@api_router.get(\"/random-pair\")
async def get_random_pair():
    # Get all samples and select 2 random ones
    all_samples = await db.text_samples.find().to_list(length=None)
    
    if len(all_samples) < 2:
        raise HTTPException(status_code=404, detail=\"Not enough text samples for pairwise comparison\")
    
    # Randomly select 2 samples
    selected_samples = random.sample(all_samples, 2)
    
    return [TextSample(**parse_from_mongo(sample)) for sample in selected_samples]