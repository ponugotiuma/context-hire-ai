// Sample demo data — pre-parsed text so judges can click "Run Demo" with zero setup.
export const SAMPLE_JD = `Senior Machine Learning Engineer — Applied LLMs

We are hiring a Senior ML Engineer to lead retrieval-augmented generation (RAG)
systems at production scale. You will own evaluation pipelines, vector search
infrastructure, and prompt orchestration for products serving millions of users.

Responsibilities:
- Design and ship RAG pipelines (embeddings, retrieval, re-ranking, generation)
- Build evaluation harnesses for LLM quality, hallucination, latency
- Optimize vector databases (pgvector, Pinecone) for scale and cost
- Partner with product on grounded, explainable AI features
- Mentor a small team of ML engineers

Requirements:
- 5+ years building production ML/NLP systems
- Hands-on experience with LLMs (OpenAI, Anthropic, open-source)
- Strong Python; comfortable with PyTorch or JAX
- Track record shipping retrieval, search, or recommendation systems
- Experience with eval frameworks (Ragas, TruLens, custom)
- Bonus: published research, open-source contributions, distributed training
`;

export const SAMPLE_RESUMES: { name: string; text: string }[] = [
  {
    name: "Priya Raman.pdf",
    text: `Priya Raman — Senior ML Engineer
github.com/priyaraman | priya.dev

EXPERIENCE
Staff ML Engineer, Notion AI — 2022–Present
- Led RAG evaluation framework processing 10M+ daily queries; cut hallucination 38%
- Designed hybrid retrieval (BM25 + dense embeddings) on pgvector, p95 < 80ms
- Mentored team of 4 engineers; shipped grounded citations product

Senior ML Engineer, Stripe — 2019–2022
- Built fraud detection models in PyTorch; 22% lift in precision
- Owned feature store and offline/online consistency

EDUCATION  MS Computer Science, Stanford. BTech IIT Bombay.
SKILLS  Python, PyTorch, pgvector, Pinecone, Ragas, LangChain, distributed training`,
  },
  {
    name: "Marcus Chen.pdf",
    text: `Marcus Chen — Backend Engineer
linkedin.com/in/marcuschen

EXPERIENCE
Backend Engineer, Shopify — 2021–Present
- Built Ruby/Rails APIs for merchant analytics
- Migrated checkout service to Go; 3x throughput
- Some Python scripting for data pipelines

Software Engineer, Square — 2018–2021
- Payment processing infrastructure in Java
- On-call rotation for transaction systems

EDUCATION  BS Computer Engineering, University of Waterloo.
SKILLS  Ruby, Go, Java, Postgres, Redis, Kafka`,
  },
  {
    name: "Dr. Aisha Okonkwo.pdf",
    text: `Aisha Okonkwo, PhD — Applied Scientist
github.com/aokonkwo | scholar.google.com/aokonkwo

EXPERIENCE
Applied Scientist, Anthropic — 2023–Present
- Research on retrieval-augmented evaluation for long-context models
- Co-authored 2 papers at NeurIPS on RAG evaluation harnesses
- Built internal eval suite adopted across 3 product teams

Research Scientist, DeepMind — 2020–2023
- Distributed training infrastructure in JAX for 70B+ models
- Open-sourced ranking benchmark with 4k GitHub stars

EDUCATION  PhD ML, University of Cambridge. MEng, Imperial College London.
SKILLS  Python, JAX, PyTorch, vector search, distributed training, LLM evaluation`,
  },
  {
    name: "Tom Bradley.pdf",
    text: `Tom Bradley — Full-Stack Developer

EXPERIENCE
Full-Stack Engineer, ClickUp — 2020–Present
- React/Node.js for task management features
- Built integrations with Slack, Google Calendar, Zoom
- Maintained Postgres schemas and Redis caches

Junior Developer, local agency — 2017–2020
- WordPress and Shopify customizations
- Some early experiments with OpenAI API for a chatbot side project

EDUCATION  BS Information Systems, Arizona State.
SKILLS  JavaScript, TypeScript, React, Node.js, Postgres`,
  },
  {
    name: "Sofia Martins.pdf",
    text: `Sofia Martins — ML Engineer
github.com/sofiam-ml | sofiamartins.io

EXPERIENCE
ML Engineer, Perplexity — 2022–Present
- Owned retrieval pipeline: query rewriting, hybrid search, cross-encoder re-ranking
- Built eval harness with custom hallucination metrics; ran weekly regressions
- Shipped LLM prompt orchestration serving 5M queries/day on OpenAI + open models

ML Engineer, Spotify — 2019–2022
- Recommendation systems for podcasts using two-tower embeddings
- A/B testing infra; collaborated with product on grounded explanations

EDUCATION  MS Data Science, NYU. BS Math, University of Lisbon.
SKILLS  Python, PyTorch, embeddings, pgvector, Pinecone, Ragas, TruLens`,
  },
];
