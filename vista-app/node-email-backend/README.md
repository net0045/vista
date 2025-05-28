# Node Email Backend

This project is a simple Node.js backend application that provides functionality to send emails using Nodemailer. It includes an API endpoint to send verification codes via email.

## Project Structure

```
node-email-backend
├── src
│   ├── api
│   │   └── sendEmail.js
│   └── index.js
├── package.json
├── .env
└── README.md
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd node-email-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file:**
   Create a `.env` file in the root directory and add your SMTP configuration:
   ```
   VITE_SMTP_HOST=your_smtp_host
   VITE_SMTP_PORT=your_smtp_port
   VITE_SMTP_USER=your_smtp_user
   VITE_SMTP_PASSWORD=your_smtp_password
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## Usage

To send an email, make a POST request to the `/api/sendEmail` endpoint with the following JSON body:

```json
{
  "email": "recipient@example.com",
  "code": "123456"
}
```

## Dependencies

- **express**: A minimal and flexible Node.js web application framework.
- **nodemailer**: A module for Node.js applications to allow easy as cake email sending.

## License

This project is licensed under the MIT License.