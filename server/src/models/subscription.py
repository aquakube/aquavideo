from dataclasses import dataclass

@dataclass
class Subscription:

    type: str
    """subscribe or unsubscribe"""

    camera: str
    """the camera name in the subscription"""

    subscribers: int
    """the number of subscribers for the camera"""