# Project Architecture - Improved Low Coupling

This document describes the refactored architecture that improves low coupling by following GRASP principles and clean architecture patterns.

## Architecture Overview

The project has been restructured to separate concerns and reduce coupling between components:

```
projectX/
├── backend/
│   ├── services/          # Business logic layer
│   ├── controllers/       # HTTP request handling
│   ├── dtos/             # Data Transfer Objects
│   ├── models.py         # Database models
│   └── app_refactored.py # Main application (refactored)
├── frontend/
│   └── src/
│       └── hooks/        # Custom API hooks
└── ARCHITECTURE.md       # This file
```

## Backend Architecture

### 1. Service Layer (`services/`)

The service layer contains business logic and acts as the **Information Expert** for each domain:

#### UserService

- **Responsibilities**: User creation, retrieval, and management
- **Methods**:
  - `create_user()` - Creates users with proper validation
  - `get_user_by_clerk_id()` - Retrieves users by Clerk ID
  - `search_instructors()` - Searches for staff members
  - `get_user_profile()` - Formats user data for API responses

#### ClassService

- **Responsibilities**: Class and enrollment management
- **Methods**:
  - `create_studio_class()` - Creates classes with instances
  - `book_class()` - Handles class booking logic
  - `cancel_enrollment()` - Manages enrollment cancellations
  - `get_student_enrollments()` - Retrieves student enrollments

#### PaymentService

- **Responsibilities**: Payment processing and Stripe integration
- **Methods**:
  - `create_payment()` - Creates payment records
  - `create_stripe_checkout_session()` - Handles Stripe integration
  - `verify_payment()` - Verifies payment completion
  - `handle_webhook_event()` - Processes Stripe webhooks

### 2. Controller Layer (`controllers/`)

Controllers handle HTTP requests and act as **Controllers** in GRASP:

#### UserController

- **Responsibilities**: HTTP request handling for user operations
- **Methods**:
  - `create_user()` - Handles user creation requests
  - `get_user_by_clerk_id()` - Handles user retrieval requests
  - `search_instructors()` - Handles instructor search requests

#### ClassController

- **Responsibilities**: HTTP request handling for class operations
- **Methods**:
  - `create_studio_class()` - Handles class creation requests
  - `book_class()` - Handles class booking requests
  - `get_student_enrolled_classes()` - Handles enrollment queries

### 3. DTO Layer (`dtos/`)

Data Transfer Objects provide **Protected Variations** and clean data formatting:

#### UserDTO

- **Purpose**: Formats user data for API responses
- **Methods**:
  - `to_dict()` - Converts to dictionary format
  - `from_user()` - Creates DTO from User model
  - `from_user_list()` - Creates DTOs from User model list

#### ClassInstanceDTO

- **Purpose**: Formats class instance data with enrollment status
- **Methods**:
  - `to_dict()` - Converts to dictionary format
  - `from_instance()` - Creates DTO from ClassInstance model

## Frontend Architecture

### Custom Hooks (`hooks/useApi.ts`)

The frontend uses custom hooks to improve coupling and provide **Indirection**:

#### useApi (Base Hook)

- **Purpose**: Generic API call handling with loading states
- **Features**:
  - Automatic loading state management
  - Error handling
  - Type-safe responses

#### useUserApi

- **Purpose**: User-related API calls
- **Methods**:
  - `createUser()` - Creates new users
  - `getUserByClerkId()` - Retrieves user data
  - `searchInstructors()` - Searches for instructors

#### useClassApi

- **Purpose**: Class-related API calls
- **Methods**:
  - `getClasses()` - Retrieves available classes
  - `bookClass()` - Books a class
  - `getEnrolledClasses()` - Gets student enrollments
  - `cancelEnrollment()` - Cancels enrollment

#### usePaymentApi

- **Purpose**: Payment-related API calls
- **Methods**:
  - `getSlidingScaleOptions()` - Gets payment options
  - `createCheckoutSession()` - Creates Stripe session
  - `verifyPayment()` - Verifies payment completion

## GRASP Principles Implementation

### ✅ Information Expert

- **UserService** is the expert for user operations
- **ClassService** is the expert for class operations
- **PaymentService** is the expert for payment operations

### ✅ Creator

- **UserService.create_user()** creates appropriate user types
- **ClassService.create_studio_class()** creates classes with instances
- **PaymentService.create_payment()** creates payment records

### ✅ High Cohesion

- Each service has focused responsibilities
- Controllers only handle HTTP concerns
- DTOs only handle data formatting

### ✅ Low Coupling

- Services don't depend on HTTP layer
- Controllers depend only on services
- Frontend components depend on hooks, not direct API calls

### ✅ Controller

- **UserController** and **ClassController** handle HTTP requests
- Route handlers delegate to controllers
- Controllers delegate to services

### ✅ Protected Variations

- DTOs protect against model changes
- Service interfaces protect against implementation changes
- Custom hooks protect against API changes

### ✅ Indirection

- Custom hooks provide indirection for API calls
- Services provide indirection for business logic
- Controllers provide indirection for HTTP handling

## Benefits of This Architecture

### 1. **Testability**

- Services can be unit tested independently
- Controllers can be tested with mocked services
- Frontend hooks can be tested with mocked APIs

### 2. **Maintainability**

- Changes to business logic only affect services
- Changes to API structure only affect controllers
- Changes to data format only affect DTOs

### 3. **Scalability**

- New services can be added without affecting existing code
- New controllers can be added for new endpoints
- New DTOs can be added for new data formats

### 4. **Reusability**

- Services can be reused across different controllers
- DTOs can be reused across different endpoints
- Custom hooks can be reused across different components

## Migration Guide

### Backend Migration

1. Replace `app.py` with `app_refactored.py`
2. Ensure all service dependencies are installed
3. Update imports in existing code to use new services

### Frontend Migration

1. Replace direct API calls with custom hooks
2. Update component imports to use new hooks
3. Remove direct fetch calls from components

## Example Usage

### Backend Service Usage

```python
# In a controller
user = UserService.create_user(user_data)
user_dto = UserDTO.from_user(user)
return jsonify({"success": True, "user": user_dto.to_dict()})
```

### Frontend Hook Usage

```typescript
// In a component
const { createUser, loading, error } = useUserApi();

const handleSubmit = async (userData) => {
  const result = await createUser(userData);
  if (result.success) {
    // Handle success
  }
};
```

This architecture significantly improves the project's adherence to GRASP principles and provides a solid foundation for future development.
