#!/bin/bash

echo "Starting Eventually Yours Shopping App Development Environment..."
echo

echo "Starting Backend..."
cd backend && python main.py &
BACKEND_PID=$!

echo "Waiting 3 seconds for backend to start..."
sleep 3

echo "Starting Frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo
echo "Development servers started!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID 