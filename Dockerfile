FROM node:14-slim as build_web

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN cd app && npm install && npm run build

RUN mkdir -p server/src/static \
    && cp -r app/build/* server/src/static \
    && cp -r server/src/static/static/* server/src/static \
    && cp app/public/favicon.png server/src/static/favicon.png \
    && rm -rf server/src/static/static \
    && rm -rf app

FROM python:3.11.1-slim

COPY --from=build_web /usr/src/app/server /usr/src/app/

WORKDIR /usr/src/app

RUN apt-get update --allow-insecure-repositories \
    && apt-get install -y netcat \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && pip install pipenv

RUN pipenv lock && pipenv install --system --deploy

# update permissions on app folder
RUN chmod -R 777 /usr/src/app

CMD [ "python3", "src/main.py" ]