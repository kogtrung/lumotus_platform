package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.CreateTopicRequest;
import com.backend.lumotus.dto.request.UpdateTopicRequest;
import com.backend.lumotus.dto.response.TopicResponse;
import com.backend.lumotus.service.TopicService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    public ResponseEntity<List<TopicResponse>> list() {
        return ResponseEntity.ok(topicService.listAll());
    }

    @GetMapping("/{topicRef}")
    public ResponseEntity<TopicResponse> get(@PathVariable String topicRef) {
        return ResponseEntity.ok(topicService.getByRef(topicRef));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TopicResponse> create(@Valid @RequestBody CreateTopicRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(topicService.create(request));
    }

    @PutMapping("/{topicRef}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TopicResponse> update(
            @PathVariable String topicRef, @Valid @RequestBody UpdateTopicRequest request) {
        return ResponseEntity.ok(topicService.updateByRef(topicRef, request));
    }

    @DeleteMapping("/{topicRef}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String topicRef) {
        topicService.deleteByRef(topicRef);
        return ResponseEntity.noContent().build();
    }
}
