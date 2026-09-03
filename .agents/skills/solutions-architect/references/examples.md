# Examples

## Direct invocation

```text
/solutions-architect Project name: Internal AI Knowledge Assistant. Business goal: Help 1,000 employees search internal policies using natural language. Main features: chat, document upload, citations, feedback, admin dashboard. Preferred cloud: AWS. Preferred stack: React, FastAPI, PostgreSQL, Qdrant. Biggest concerns: accuracy, security, cost.
```

## Expected output behavior

The response should:

- Classify this as a Startup Production System or Mid-size Business Platform depending on traffic and compliance needs.
- Compare modular monolith, microservices, and serverless options.
- Recommend a practical initial architecture.
- Analyze React/FastAPI/PostgreSQL/Qdrant against alternatives.
- Recommend AWS services such as CloudFront, S3, ECS/App Runner, RDS, ElastiCache, SQS, Secrets Manager, CloudWatch, and optionally Bedrock/OpenAI/Azure OpenAI depending on constraints.
- Include an AI/RAG pipeline with ingestion, parsing, chunking, embeddings, vector search, retrieval, reranking, citations, feedback, and evaluation.

## Strong final recommendation pattern

```text
Start with a modular monolith deployed on managed cloud services. Keep domain modules clean inside the application, use PostgreSQL as the system of record, Redis for caching only where needed, object storage for files, and a queue for background processing. For AI/RAG, keep ingestion, retrieval, generation, citations, and evaluation logically separated. Move to microservices only when scale, team ownership, or deployment independence requires it.
```
