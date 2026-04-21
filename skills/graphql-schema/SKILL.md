---
name: graphql-schema
description: Design effective GraphQL schemas with types, queries, mutations, subscriptions, and directives. Implement data loading patterns, pagination, and schema stitching.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - graphql
    - api-design
    - schema
    - types
    - apollo
  personas:
    developer: 85
    researcher: 40
    analyst: 35
    operator: 30
    creator: 35
    support: 30
  summary: Design powerful GraphQL schemas with types, queries, mutations, and data loaders
  featured: false
  requires:
    tools: [file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# GraphQL Schema Design

GraphQL provides a complete description of your API with types, queries, mutations, and subscriptions.

## Schema First Design

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  createdAt: DateTime!
  posts: [Post!]!
  postCount: Int!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  comments: [Comment!]!
  createdAt: DateTime!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  createdAt: DateTime!
}
```

## Queries

```graphql
type Query {
  user(id: ID!): User
  users(limit: Int = 10, offset: Int = 0): [User!]!
  post(id: ID!): Post
  postsByAuthor(authorId: ID!): [Post!]!
  
  # Nested queries
  searchPosts(query: String!): [Post!]!
}
```

## Mutations

```graphql
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User
  deleteUser(id: ID!): Boolean!
  
  createPost(input: CreatePostInput!): Post!
  publishPost(id: ID!): Post
}

input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input CreatePostInput {
  title: String!
  content: String!
  authorId: ID!
}
```

## Pagination Patterns

### Offset Pagination

```graphql
type Query {
  posts(offset: Int, limit: Int): PostConnection!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Cursor Pagination

```graphql
type Query {
  posts(after: String, before: String, first: Int, last: Int): PostConnection!
}
```

## DataLoader Pattern (N+1 Prevention)

```python
from dataloader import DataLoader

class UserLoader(DataLoader):
    def __init__(self):
        super().__init__(self.batch_load)
    
    async def batch_load(self, user_ids):
        users = await db.get_users_by_ids(user_ids)
        user_map = {u.id: u for u in users}
        return [user_map.get(uid) for uid in user_ids]

user_loader = UserLoader()

# In resolver
async def resolve_posts(author):
    return await post_loader.load(author.id)
```

## Custom Scalars

```python
from graphql import GraphQLScalarType
from datetime import datetime

datetime_scalar = GraphQLScalarType(
    name='DateTime',
    serialize=lambda value: value.isoformat() if isinstance(value, datetime) else value,
    parse_value=lambda value: datetime.fromisoformat(value)
)
```

## Schema Stitching

```python
from graphql import merge_schemas

schema = merge_schemas([
    user_schema,
    post_schema,
    comment_schema
])
```

## Directives

```graphql
directive @auth(requires: Role!) on FIELD_DEFINITION

enum Role {
  ADMIN
  USER
  GUEST
}

type Query {
  protectedField: String! @auth(requires: ADMIN)
}
```

## Deprecation

```graphql
type Field {
  oldField: String @deprecated(reason: "Use newField instead")
  newField: String!
}
```

## Best Practices

1. **Use meaningful names** — descriptive over concise
2. **Nullable vs Non-Null** — `!` only when guaranteed
3. **Connection pattern** — for paginated lists
4. **Input types** — for complex arguments
5. **Naming conventions** — PascalCase types, camelCase fields
6. **Versioning** — add fields, rarely remove
