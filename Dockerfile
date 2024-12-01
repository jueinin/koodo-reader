FROM node:18-slim as builder
RUN apt-get update && apt-get install -y jq curl wget python3
WORKDIR /app

### Get the latest release source code tarball
# RUN tarball_url=$(curl -s https://api.github.com/repos/koodo-reader/koodo-reader/releases/latest | jq -r ".tarball_url") \
#     && wget -qO- $tarball_url \
#     | tar xvfz - --strip 1

COPY . /app

### --network-timeout 1000000 as a workaround for slow devices
### when the package being installed is too large, Yarn assumes it's a network problem and throws an error
RUN yarn config set registry https://registry.npmmirror.com \
&& yarn config set electron_mirror https://npmmirror.com/mirrors/electron/ \
&& yarn config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/ \
&& yarn config set sass_binary_site https://npmmirror.com/mirrors/node-sass/ \
&& yarn config set phantomjs_cdnurl https://npmmirror.com/mirrors/phantomjs/ \
&& yarn config set chromedriver_cdnurl https://npmmirror.com/mirrors/chromedriver/ \
&& yarn config set operadriver_cdnurl https://npmmirror.com/mirrors/operadriver/ \
&& yarn config set fse_binary_host_mirror https://npmmirror.com/mirrors/fsevents/ \
&& yarn --network-timeout 1000000

### Separate `yarn build` layer as a workaround for devices with low RAM.
### If build fails due to OOM, `yarn install` layer will be already cached.
RUN yarn \
    && yarn build

### Nginx or Apache can also be used, Caddy is just smaller in size
FROM caddy:latest
COPY --from=builder /app/build /usr/share/caddy