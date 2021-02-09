# build stage
FROM node:14-alpine as build
RUN mkdir /app
WORKDIR /app
COPY package.json /app
# RUN npm install yarn -g
RUN yarn install
COPY . /app
RUN yarn build


# Final App
FROM nginx:1.19-alpine
COPY --from=build /app/build /usr/share/nginx/html