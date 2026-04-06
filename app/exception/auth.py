class InvalidCodeException(Exception):
    def __init__(self, message: str = "유효하지 않은 코드입니다. 다시 확인해주세요."):
        self.message = message
        super().__init__(self.message)

class ForbiddenException(Exception):
    def __init__(self, message: str = "권한이 없습니다."):
        self.message = message
        super().__init__(self.message)

class NotFoundException(Exception):
    def __init__(self, message: str = "존재하지 않는 코드입니다."):
        self.message = message
        super().__init__(self.message)

class AdminCodeException(Exception):
    def __init__(self, message: str = "관리자 코드는 삭제할 수 없습니다."):
        self.message = message
        super().__init__(self.message)