# ── Stage 1: Build ───────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml trước để cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source và build
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Non-root user (bảo mật)
RUN addgroup -S lumotus && adduser -S lumotus -G lumotus

# Copy jar từ build stage
COPY --from=builder /app/target/*.jar app.jar

# Thư mục upload (media)
RUN mkdir -p /app/uploads && chown lumotus:lumotus /app/uploads

USER lumotus

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
