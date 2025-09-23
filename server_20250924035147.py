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
