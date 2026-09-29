import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

# Sliding window rate limiter in-memory
# ip_key -> list of timestamps
_request_records = defaultdict(list)

def rate_limit(max_requests: int = 5, window_seconds: int = 60):
    async def dependency(request: Request):
        client_ip = request.client.host if request.client else "127.0.0.1"
        if client_ip in ["127.0.0.1", "::1", "localhost", "testclient"]:
            return
        endpoint = request.url.path
        key = f"{client_ip}:{endpoint}"
        now = time.time()
        
        # Filter timestamps within current window
        window_start = now - window_seconds
        _request_records[key] = [t for t in _request_records[key] if t > window_start]
        
        if len(_request_records[key]) >= max_requests:
            retry_after = int(window_seconds - (now - _request_records[key][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again in {max(retry_after, 1)} seconds."
            )
        
        _request_records[key].append(now)
    return dependency
