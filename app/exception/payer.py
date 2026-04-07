class NotFoundException(Exception):
    def __init__(self, message: str):
        self.message = message

class HasReceiptException(Exception):
    def __init__(self, message: str):
        self.message = message