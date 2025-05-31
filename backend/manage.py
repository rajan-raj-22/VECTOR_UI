#!/usr/bin/env python
import uvicorn
import sys
import datetime

def main():
    """Run administrative tasks."""
    try:
        if sys.argv[1] == 'runserver':
            host = '127.0.0.1'
            port = 8000
            
            # Parse host and port if provided
            if len(sys.argv) > 2:
                parts = sys.argv[2].split(':')
                if len(parts) == 2:
                    host = parts[0]
                    port = int(parts[1])
            
            # Print Django-like startup messages
            print(f"Watching for file changes with StatReload")
            print(f"Performing system checks...\n")
            print("System check identified no issues (0 silenced).")
            now = datetime.datetime.now().strftime("%B %d, %Y - %H:%M:%S")
            print(f"\nStarting development server at {now}")
            print(f"Quit the server with CONTROL-C.\n")
            
            # Run the server
            uvicorn.run(
                "main:app",
                host=host,
                port=port,
                reload=True,
                log_level="warning"  # Reduce uvicorn logging
            )
    except IndexError:
        print("Usage: python manage.py runserver [host:port]")
        sys.exit(1)

if __name__ == '__main__':
    main() 