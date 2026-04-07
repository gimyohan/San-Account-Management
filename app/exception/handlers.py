from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.exception import category, auth, payer

def register_handlers(app: FastAPI):
    #category

    @app.exception_handler(category.NotFoundException)
    async def not_found_handler(request: Request, exc: category.NotFoundException):
        return JSONResponse(status_code=404, content={"error": "NOT_FOUND", "detail": str(exc.message)})

    @app.exception_handler(category.ConflictException)
    async def conflict_handler(request: Request, exc: category.ConflictException):
        return JSONResponse(status_code=409, content={"error": "CONFLICT", "detail": str(exc.message)})

    @app.exception_handler(category.LevelException)
    async def level_handler(request: Request, exc: category.LevelException):
        return JSONResponse(status_code=409, content={"error": "LEVEL_EXCEEDED", "detail": str(exc.message)})

    @app.exception_handler(category.CycleException)
    async def cycle_handler(request: Request, exc: category.CycleException):
        return JSONResponse(status_code=409, content={"error": "CYCLE", "detail": str(exc.message)})

    # auth
    @app.exception_handler(auth.InvalidCodeException)
    async def invalid_code_handler(request: Request, exc: auth.InvalidCodeException):
        return JSONResponse(status_code=401, content={"error": "INVALID_CODE", "detail": str(exc.message)})
    
    @app.exception_handler(auth.ForbiddenException)
    async def forbidden_handler(request: Request, exc: auth.ForbiddenException):
        return JSONResponse(status_code=403, content={"error": "FORBIDDEN", "detail": str(exc.message)})
    
    @app.exception_handler(auth.NotFoundException)
    async def not_found_handler(request: Request, exc: auth.NotFoundException):
        return JSONResponse(status_code=404, content={"error": "NOT_FOUND", "detail": str(exc.message)})
    
    @app.exception_handler(auth.AdminCodeException)
    async def admin_code_handler(request: Request, exc: auth.AdminCodeException):
        return JSONResponse(status_code=409, content={"error": "CANNOT_DELETE_ADMIN", "detail": str(exc.message)})

    # payer
    @app.exception_handler(payer.NotFoundException)
    async def not_found_handler(request: Request, exc: payer.NotFoundException):
        return JSONResponse(status_code=404, content={"error": "NOT_FOUND", "detail": str(exc.message)})
    
    @app.exception_handler(payer.HasReceiptException)
    async def has_receipt_handler(request: Request, exc: payer.HasReceiptException):
        return JSONResponse(status_code=409, content={"error": "HAS_RECEIPT", "detail": str(exc.message)})
