package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "topics")
@Getter
@Setter
@NoArgsConstructor
public class Topic extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String icon;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "color_hex", length = 7)
    private String colorHex;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
