# Data Dictionary - Student Activity Matcher

**Version:** 1.0.0
**Subsystem:** Student Activity Matcher

This document details the local database schema specifically managed by the NestJS backend of the Student Activity Matcher subsystem. 
Following the CSMJU2030 `data-dictionary.md` core rule: "Local Data อยู่ใน Schema ของ Subsystem", this file outlines tables local to `csmju-student-activity-matcher/backend/prisma/schema.prisma`.

## 1. Local Database Entities

### 1.1 Booking
Stores room reservations mapped to a `coreUserId`. 
* **roomCode**: String - Mapped from Core Hub rooms (`LAB-1`).
* **coreUserId**: String - Foreign ref to Core Hub `sub`.
* **status**: BookingStatus Object (PENDING, APPROVED, REJECTED, CANCELLED).
* **title**, **purpose**, **startsAt**, **endsAt**: Standard activity details.

### 1.2 Student
Local Student tracking, linked indirectly via mock configurations or core hub mapping.
* **studentId**: String - Unique identification (e.g. 65012345).
* **dataSource**: String - Origin (SEED, USER, etc).
* **interestIds**, **lookingForIds**, **groupIds**, **activityIds**: Relational maps to standard categories.

### 1.3 Activities & Groups
* **Activity**: Stores student-created activities. Includes capacity, dates, location.
* **Group**: Stores student communities.
* **Interest**: Category metadata.

## 2. API Data Transfer Objects (DTO)

### CreateActivityDto
Matches frontend requests strictly exactly:
```typescript
{
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  interestIds: string[];
  coverImage?: string;
}
```
*(All fields are enforced over JSON parsing when using the NestJS Validation pipes)*
