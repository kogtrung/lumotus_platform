package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.CreateTopicRequest;
import com.backend.lumotus.dto.request.UpdateTopicRequest;
import com.backend.lumotus.dto.response.TopicResponse;
import com.backend.lumotus.entity.Topic;
import com.backend.lumotus.exception.ConflictException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.TopicRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicRepository topicRepository;

    @Transactional(readOnly = true)
    public List<TopicResponse> listAll() {
        return topicRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(TopicResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TopicResponse getBySlug(String slug) {
        return TopicResponse.from(findBySlugOrThrow(slug));
    }

    @Transactional
    public TopicResponse create(CreateTopicRequest request) {
        if (topicRepository.existsBySlug(request.slug())) {
            throw new ConflictException("Topic slug already exists");
        }
        Topic topic = new Topic();
        topic.setName(request.name());
        topic.setSlug(request.slug());
        topic.setDescription(request.description());
        topic.setIcon(request.icon());
        topic.setColorHex(request.colorHex());
        if (request.sortOrder() != null) {
            topic.setSortOrder(request.sortOrder());
        }
        return TopicResponse.from(topicRepository.save(topic));
    }

    @Transactional
    public TopicResponse updateBySlug(String slug, UpdateTopicRequest request) {
        Topic topic = findBySlugOrThrow(slug);
        if (request.name() != null) {
            topic.setName(request.name());
        }
        if (request.description() != null) {
            topic.setDescription(request.description());
        }
        if (request.icon() != null) {
            topic.setIcon(request.icon());
        }
        if (request.colorHex() != null) {
            topic.setColorHex(request.colorHex());
        }
        if (request.sortOrder() != null) {
            topic.setSortOrder(request.sortOrder());
        }
        return TopicResponse.from(topicRepository.save(topic));
    }

    @Transactional
    public void deleteBySlug(String slug) {
        Topic topic = findBySlugOrThrow(slug);
        topicRepository.delete(topic);
    }

    private Topic findBySlugOrThrow(String slug) {
        return topicRepository
                .findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + slug));
    }
}
