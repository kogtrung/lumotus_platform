package com.backend.lumotus.service;

import com.backend.lumotus.config.CloudinaryProperties;
import com.backend.lumotus.dto.response.MediaUploadResponse;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.media.MediaFolder;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MediaService {

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final Cloudinary cloudinary;
    private final CloudinaryProperties cloudinaryProperties;

    public MediaUploadResponse upload(MultipartFile file, MediaFolder folder) {
        if (!cloudinaryProperties.isConfigured()) {
            throw new BadRequestException(
                    "Cloudinary chưa cấu hình — đặt CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET trong .env");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }

        long maxBytes = cloudinaryProperties.maxFileSizeMb() * 1024L * 1024L;
        if (file.getSize() > maxBytes) {
            throw new BadRequestException("File too large — max " + cloudinaryProperties.maxFileSizeMb() + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Only JPEG, PNG, WebP, GIF images are allowed");
        }

        String uploadFolder = cloudinaryProperties.baseFolder() + "/" + folder.path();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary
                    .uploader()
                    .upload(
                            file.getBytes(),
                            ObjectUtils.asMap("folder", uploadFolder, "resource_type", "image"));

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            if (url == null) {
                throw new BadRequestException("Upload failed — no URL returned");
            }
            return new MediaUploadResponse(url, publicId, folder.path());
        } catch (IOException ex) {
            throw new BadRequestException("Failed to read upload file");
        } catch (Exception ex) {
            throw new BadRequestException("Cloudinary upload failed: " + ex.getMessage());
        }
    }
}
