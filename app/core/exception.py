class NotFoundException(Exception):
    def __init__(self, detail: str = "찾을 수 없습니다.", error: str = "NOT_FOUND"):
        self.detail = detail
        self.error = error

class ConflictException(Exception):
    def __init__(self, detail: str = "데이터가 충돌합니다.", error: str = "CONFLICT"):
        self.detail = detail
        self.error = error

class UnauthorizedException(Exception):
    def __init__(self, detail: str = "로그인이 필요합니다.", error: str = "UNAUTHORIZED"):
        self.detail = detail
        self.error = error

class ForbiddenException(Exception):
    def __init__(self, detail: str = "권한이 없습니다.", error: str = "FORBIDDEN"):
        self.detail = detail
        self.error = error

class InvalidException(Exception):
    def __init__(self, detail: str = "유효하지 않습니다.", error: str = "INVALID"):
        self.detail = detail
        self.error = error

class UnprocessableEntityException(Exception):
    def __init__(self, detail: str = "처리할 수 없습니다.", error: str = "UNPROCESSABLE_ENTITY"):
        self.detail = detail
        self.error = error