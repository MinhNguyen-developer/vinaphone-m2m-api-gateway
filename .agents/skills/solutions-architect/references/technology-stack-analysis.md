# Technology Stack Analysis Rules

Always compare candidate stacks before choosing a final recommendation.

## Evaluation criteria

Evaluate each stack across:

- Requirement fit
- Pros
- Cons
- Complexity
- Cost impact
- Performance
- Security
- Scalability
- Team fit
- Ecosystem maturity
- Hiring availability
- Long-term maintainability
- Operational burden
- Vendor lock-in risk

## Required comparison table

| Stack Option | Pros | Cons | Complexity | Cost Impact | Team Fit | Best For | Risks |
|---|---|---|---|---|---|---|---|
| Option A |  |  | Low/Medium/High | Low/Medium/High | Weak/Good/Strong |  |  |
| Option B |  |  | Low/Medium/High | Low/Medium/High | Weak/Good/Strong |  |  |
| Option C |  |  | Low/Medium/High | Low/Medium/High | Weak/Good/Strong |  |  |

## Common candidate options

### Frontend

- React: strong ecosystem, flexible, good hiring pool; needs architectural discipline.
- Next.js: good for SSR/SEO/fullstack React, strong productivity; can add framework complexity.
- Vue: approachable, productive; smaller enterprise hiring pool than React in some markets.
- Angular: strong opinionated enterprise framework; heavier learning curve.
- React Native: good code reuse for mobile; native edge cases may require platform skills.
- Flutter: strong cross-platform UI; Dart skill requirement.

### Backend

- Node.js/NestJS: strong TypeScript stack, good for APIs and web teams; CPU-heavy workloads need care.
- Python/FastAPI: excellent for AI/data APIs and fast delivery; async and packaging discipline matters.
- Java/Spring Boot: enterprise maturity, strong performance, large ecosystem; more boilerplate.
- .NET: strong enterprise stack, good tooling; depends on team ecosystem.
- Golang: high performance, simple deployment, great for services; less expressive for rapid product iteration.
- Serverless functions: low ops and auto-scaling; cold starts, observability, and vendor lock-in need attention.

### Databases

- PostgreSQL: default recommendation for most transactional systems; strong relational, JSON, indexing, extensions.
- MySQL: reliable and familiar; fewer advanced features than PostgreSQL in many use cases.
- MongoDB: flexible documents; weaker fit for complex transactional relational workflows.
- Redis: cache, sessions, queues, rate limiting; not primary durable storage for most business data.
- DynamoDB/Firestore/Cosmos DB: scalable managed NoSQL; query design and lock-in are important.
- ClickHouse: excellent analytics; not an OLTP replacement.
- Elasticsearch/OpenSearch: full-text search and analytics; operational cost can be high.

### AI and Search

- LangChain: broad ecosystem for LLM apps; abstraction can add complexity.
- LangGraph: strong for stateful agent workflows; more useful when workflows require explicit graph/state control.
- LlamaIndex: strong document/data indexing abstractions; compare with LangChain based on team familiarity.
- Qdrant: strong open-source vector database, good filtering; requires operations unless managed.
- Pinecone: managed vector DB, low ops; vendor cost and lock-in.
- pgvector: simple when PostgreSQL is already used; may not fit very large vector workloads.
- OpenSearch vector search: good when OpenSearch already exists; may be heavier than dedicated vector DB.

### Messaging

- SQS/SNS, Pub/Sub, Azure Service Bus: managed cloud-native queues; lower operations.
- RabbitMQ: flexible broker; requires operations if self-hosted.
- Kafka: high-throughput event streaming; overkill for simple async jobs.
- Redis Streams: simple when Redis is already used; retention and durability must be designed.

## Recommendation logic

Prefer:

- Team familiarity over trendy tools.
- Managed services for small teams.
- PostgreSQL as default transactional database unless requirements indicate otherwise.
- Redis only when caching, sessions, rate limiting, or queues are justified.
- Kubernetes only when platform maturity exists.
- Microservices only when scale/team/domain complexity justifies distributed systems.
- AI frameworks only when they reduce complexity; direct SDK usage is acceptable for simple workflows.
