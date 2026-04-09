from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core import exception

def register_handlers(app: FastAPI):
    @app.exception_handler(exception.InvalidException)
    async def invalid_handler(request: Request, exc: exception.InvalidException):
        return JSONResponse(status_code=400, content={"error": exc.error, "detail": exc.detail})
        

    @app.exception_handler(exception.UnauthorizedException)
    async def unauthorized_handler(request: Request, exc: exception.UnauthorizedException):
        return JSONResponse(status_code=401, content={"error": exc.error, "detail": exc.detail})


    @app.exception_handler(exception.ForbiddenException)
    async def forbidden_handler(request: Request, exc: exception.ForbiddenException):
        return JSONResponse(status_code=403, content={"error": exc.error, "detail": exc.detail})


    @app.exception_handler(exception.NotFoundException)
    async def not_found_handler(request: Request, exc: exception.NotFoundException):
        return JSONResponse(status_code=404, content={"error": exc.error, "detail": exc.detail})
    

    @app.exception_handler(exception.ConflictException)
    async def conflict_handler(request: Request, exc: exception.ConflictException):
        return JSONResponse(status_code=409, content={"error": exc.error, "detail": exc.detail})

    @app.exception_handler(exception.UnprocessableEntityException)
    async def unprocessable_entity_handler(request: Request, exc: exception.UnprocessableEntityException):
        return JSONResponse(status_code=422, content={"error": exc.error, "detail": exc.detail})