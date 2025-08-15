#!/bin/bash

# AI Tutor Platform - Local Development Setup
# Run this script to set up your local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up AI Tutor Platform for Local Development${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20 or higher.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version 20 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) is installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) is installed${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}🔧 Creating environment file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Environment file created at .env${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your configuration${NC}"
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi

# Generate Prisma client
echo -e "${YELLOW}🗄️  Generating Prisma client...${NC}"
npx prisma generate

# Push database schema
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
npm run db:push

# Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

# Run linter
echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint

echo -e "${GREEN}✅ Local development setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Update the .env file with your configuration${NC}"
echo -e "${BLUE}2. Run 'npm run dev' to start the development server${NC}"
echo -e "${BLUE}3. Visit http://localhost:3000 to view the application${NC}"
echo ""
echo -e "${GREEN}🚀 Happy coding!${NC}"