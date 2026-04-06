class NotFoundException(Exception):
    def __init__(self, message: str = "Category not found"):
        self.message = message
        super().__init__(self.message)

class ConflictException(Exception):
    def __init__(self, message: str = "Category already exists"):
        self.message = message
        super().__init__(self.message)

class CycleException(Exception):
    def __init__(self, message: str = "Category cycle detected"):
        self.message = message
        super().__init__(self.message)

class LevelException(Exception):
    def __init__(self, message: str = "Category level exceeds limit"):
        self.message = message
        super().__init__(self.message)