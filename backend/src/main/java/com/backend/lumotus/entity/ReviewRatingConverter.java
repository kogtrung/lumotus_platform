package com.backend.lumotus.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ReviewRatingConverter implements AttributeConverter<ReviewRating, String> {

    @Override
    public String convertToDatabaseColumn(ReviewRating attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public ReviewRating convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ReviewRating.valueOf(dbData);
    }
}
