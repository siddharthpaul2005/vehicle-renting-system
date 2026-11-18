# One image = React frontend + Spring Boot API, served together on $PORT (Render sets it).

# 1) Build the React app (Debian/glibc: TypeScript 7's native compiler has no musl/Alpine build)
FROM node:22-slim AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Build the Spring Boot jar with the React build bundled as static files
FROM maven:3.9.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /app/dist ./src/main/resources/static
RUN mvn -B -q clean package -DskipTests

# 3) Slim runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=backend /app/target/*.jar app.jar
USER app
EXPOSE 8080
# Required env vars: DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET (see backend/.env.example)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
