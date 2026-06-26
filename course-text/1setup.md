# Setting Up The Repo

Before we start building features, we need to get the project up and running on your machine. This involves cloning the repository, installing dependencies, and setting up your development environment.

The repo has all the tools and structure we'll need for the rest of the workshop. Taking time now to set this up properly will save you headaches later.

## Steps To Complete

### Clone The Repository

- [ ] Open your terminal and navigate to where you want to store the project

- [ ] Clone the repository from GitHub

```bash
git clone https://github.com/mattpocock/ai-engineer-workshop-2026-project.git
cd ai-engineer-workshop-2026-project
```

### Install Node.js (if needed)

- [ ] Check if you have Node.js installed

```bash
node --version
```

If you see a version number like `v22.x.x` or `v24.x.x`, you're good to go. If not, or if you're on an older version, visit [nodejs.org](https://nodejs.org/en/download) and install Node.js version 22 or 24.

### Install Project Dependencies

- [ ] From the project root directory, install all dependencies

```bash
npm install
```

### Set Up The Database

- [ ] Seed the database with initial data

```bash
npm run db:seed
```

This will populate your local database with the data needed for the workshop exercises.

### Verify The Setup

- [ ] Start the development server

```bash
npm run dev
```

You should see output indicating the dev server is running at `localhost:5173`.

- [ ] Open your browser and visit `localhost:5173`

You should see the application running without any errors.

- [ ] Stop the dev server

Press `Ctrl+C` (or `Cmd+C` on Mac) in your terminal to stop the server.

Congratulations! Your development environment is ready. You're now set up to start building features with AI assistance.
