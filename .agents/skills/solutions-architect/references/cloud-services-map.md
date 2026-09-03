# Cloud Service Map: AWS vs GCP vs Azure

Use this reference when recommending cloud services.

| Component | AWS | GCP | Azure | Notes |
|---|---|---|---|---|
| Frontend hosting | S3 + CloudFront, Amplify | Cloud Storage + Cloud CDN, Firebase Hosting | Static Web Apps, Blob Storage + CDN | Static apps can be hosted cheaply through object storage + CDN. |
| Backend compute | ECS Fargate, EKS, Lambda, App Runner, EC2 | Cloud Run, GKE, Cloud Functions, Compute Engine | App Service, AKS, Functions, VMs | Prefer managed container/serverless options for small teams. |
| API gateway | API Gateway, ALB | API Gateway, Cloud Load Balancing | API Management, Application Gateway | Use API gateway for auth/rate limits/versioning; ALB/LB is often simpler. |
| Relational database | RDS, Aurora | Cloud SQL, AlloyDB | Azure SQL, Azure Database for PostgreSQL/MySQL | Use managed database for production. |
| NoSQL database | DynamoDB, DocumentDB | Firestore, Bigtable | Cosmos DB | Use when access patterns justify NoSQL. |
| Cache | ElastiCache Redis | Memorystore Redis | Azure Cache for Redis | Useful for caching, sessions, queues, rate limits. |
| Object storage | S3 | Cloud Storage | Blob Storage | Use for documents, images, backups, exports. |
| Queue | SQS, SNS, EventBridge | Pub/Sub, Cloud Tasks, Eventarc | Service Bus, Event Grid | Prefer managed queues for async workloads. |
| Streaming | MSK, Kinesis | Pub/Sub, Dataflow | Event Hubs, Stream Analytics | Kafka/Kinesis/Event Hubs for high-volume streams. |
| Container registry | ECR | Artifact Registry | Azure Container Registry | Store container images close to compute. |
| Secrets | Secrets Manager, SSM Parameter Store | Secret Manager | Key Vault | Never store secrets in code or CI variables without controls. |
| Identity | Cognito, IAM Identity Center | Identity Platform, Cloud Identity | Entra ID, Entra External ID/B2C | Match existing enterprise identity provider when possible. |
| CDN | CloudFront | Cloud CDN | Azure CDN / Front Door | Use for frontend assets and global edge caching. |
| Monitoring | CloudWatch, X-Ray | Cloud Operations | Azure Monitor, Application Insights | Add OpenTelemetry for portability when needed. |
| Data warehouse | Redshift | BigQuery | Synapse Analytics | Use when analytics exceeds OLTP reporting. |
| AI services | Bedrock, SageMaker | Vertex AI, Gemini | Azure OpenAI, Azure AI Foundry | Choose based on model access, data policy, latency, and enterprise contracts. |
| IaC | CloudFormation, CDK, Terraform | Deployment Manager, Terraform | Bicep, ARM, Terraform | Terraform is portable; native IaC can be more integrated. |

## Cloud recommendation rules

- Recommend AWS when the team already uses AWS, needs broad service coverage, or wants mature managed infrastructure options.
- Recommend GCP when data analytics, BigQuery, Cloud Run, or Google AI ecosystem is a strong fit.
- Recommend Azure when the organization uses Microsoft 365, Entra ID, Azure OpenAI, or enterprise Microsoft governance.
- Avoid multi-cloud unless there is a strong business reason. Multi-cloud increases cost, complexity, security work, and operational burden.
- Prefer managed services for production unless cost, compliance, or customization requires self-hosting.
