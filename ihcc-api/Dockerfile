FROM node:12.16.1-alpine

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# install curl
RUN apk add curl

CMD [ "npm", "run", "start-prod" ]
