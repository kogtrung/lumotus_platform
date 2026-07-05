package com.backend.lumotus.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ReviewRatingConverter implements AttributeConverter<ReviewRating, Integer> {

    @Override
    public Integer convertToDatabaseColumn(ReviewRating attribute) {
        return attribute == null ? null : attribute.quality();
    }

    @Override
    public ReviewRating convertToEntityAttribute(Integer dbData) {
        return dbData == null ? null : ReviewRating.fromQuality(dbData);
    }
}
