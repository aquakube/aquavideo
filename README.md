# Aquavid

This repository maintains the UI for live video playback.

## Deploy

development:
```skaffold run -p dev```

production:
```skaffold run -p prod```

NOTE: [kube-video](https://bitbucket.org/foreveroceans/kube-video/src/main/) video controller depends on the camera map deployed here
So if you're updating the config map sets in the overlays,
then run the following command after the changes have been applied.
```kubectl rollout restart deployment video-controller -n video```

## App

```npm run start```


## Server

```
KAFKA_BROKERS=10.0.3.27:30130 \
PROMETHEUS_URL=http://127.0.0.1:55343 \
LOCAL=true \
python3 main.py
```

```
curl -N 'http://10.0.3.27:30210/api/camera_events?cameras=koa02-eagle180-02,koa02-eagle180-01'
```