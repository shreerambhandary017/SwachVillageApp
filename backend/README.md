# Swach Village Backend

This is the Flask backend API for the Swach Village app, which handles authentication and data management for eco-friendly businesses and consumers.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```
   cp env.example .env
   ```
   Then edit the `.env` file with your database credentials and secret keys.

5. Set up the MySQL database:
   - Create a database named `swach_village`
   - Run the SQL script in `database/schema.sql`

## Running the Server

```
python run.py
```

The server will start at http://localhost:5000

## API Endpoints

### Authentication

- **POST /api/auth/login**: Authenticate a user
  - Request Body:
    ```json
    {
      "identifier": "email@example.com", (or phone number)
      "password": "password123",
      "role": "business" (or "consumer")
    }
    ```
  - Response:
    ```json
    {
      "token": "JWT_TOKEN",
      "user": {
        "id": 1,
        "name": "User Name",
        "email": "email@example.com",
        "role": "business"
      }
    }
    ```

## Security Features

- Passwords are hashed using bcrypt
- Authentication uses JWT tokens
- Role-based access control
- Secure session handling 