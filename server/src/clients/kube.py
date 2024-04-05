from kubernetes import client

def list_managed_videos(
    group: str = "foreveroceans.io",
    version: str = "v1",
    namespace: str = "video",
    plural="videos",
    label_selector: str = "app.kubernetes.io/managed-by=video-controller",
):
    """
    Lists all custom resources that are managed by the video controller.
    """
    api_instance = client.CustomObjectsApi()
    return api_instance.list_namespaced_custom_object(group, version, namespace, plural, label_selector=label_selector)