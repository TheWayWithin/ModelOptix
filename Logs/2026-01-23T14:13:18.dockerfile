2026-01-23T14:13:18.841527664Z [inf]  
2026-01-23T14:13:20.271981599Z [inf]  [35m[Region: us-east4][0m
2026-01-23T14:13:20.376856107Z [inf]  
2026-01-23T14:13:20.376878881Z [inf]  [38;2;125;86;243m╭─────────────────╮[0m
2026-01-23T14:13:20.376883331Z [inf]  [38;2;125;86;243m│[0m Railpack 0.17.1 [38;2;125;86;243m│[0m
2026-01-23T14:13:20.376886514Z [inf]  [38;2;125;86;243m╰─────────────────╯[0m
2026-01-23T14:13:20.376890892Z [inf]  
2026-01-23T14:13:20.376894005Z [inf]  [97m↳ Detected Node[0m
2026-01-23T14:13:20.376897277Z [inf]  [97m↳ Using pnpm package manager[0m
2026-01-23T14:13:20.376900694Z [inf]  [97m↳ Installing pnpm@9.15.2 with Corepack[0m
2026-01-23T14:13:20.376903548Z [inf]  
2026-01-23T14:13:20.376906431Z [inf]  [1mPackages[0m
2026-01-23T14:13:20.376909729Z [inf]  [38;5;238m──────────[0m
2026-01-23T14:13:20.376912707Z [inf]  [95mnode[0m  [38;5;238m│[0m  [96m22.22.0[0m  [38;5;238m│[0m  railpack default (22)
2026-01-23T14:13:20.376915505Z [inf]  [95mpnpm[0m  [38;5;238m│[0m  [96m9.15.2[0m   [38;5;238m│[0m  package.json > packageManager (9.15.2)
2026-01-23T14:13:20.376918271Z [inf]  
2026-01-23T14:13:20.376921331Z [inf]  [1mSteps[0m
2026-01-23T14:13:20.376924259Z [inf]  [38;5;238m──────────[0m
2026-01-23T14:13:20.376928498Z [inf]  [95m▸ install[0m
2026-01-23T14:13:20.376932205Z [inf]  [38;5;245m$[0m [1mnpm i -g corepack@latest && corepack enable && corepack prepare --activate[0m
2026-01-23T14:13:20.376936241Z [inf]  [38;5;245m$[0m [1mpnpm install --frozen-lockfile --prefer-offline[0m
2026-01-23T14:13:20.376940150Z [inf]  
2026-01-23T14:13:20.376947106Z [inf]  [95m▸ build[0m
2026-01-23T14:13:20.376950112Z [inf]  [38;5;245m$[0m [1mpnpm run build[0m
2026-01-23T14:13:20.376953014Z [inf]  
2026-01-23T14:13:20.376955782Z [inf]  [1mDeploy[0m
2026-01-23T14:13:20.376958971Z [inf]  [38;5;238m──────────[0m
2026-01-23T14:13:20.376963864Z [inf]  [38;5;245m$[0m [1mpnpm run start[0m
2026-01-23T14:13:20.376967989Z [inf]  
2026-01-23T14:13:20.376971141Z [inf]  
2026-01-23T14:13:20.378437104Z [inf]  Successfully prepared Railpack plan for build
2026-01-23T14:13:20.378458063Z [inf]  
2026-01-23T14:13:20.378461633Z [inf]  
2026-01-23T14:13:20.378938287Z [inf]  context: 4cz5-px41
2026-01-23T14:13:20.923793710Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T14:13:20.923839405Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T14:13:20.923854523Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T14:13:20.923869567Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T14:13:20.940956189Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T14:13:20.942754967Z [inf]  resolve image config for docker-image://ghcr.io/railwayapp/railpack-frontend:v0.17.1
2026-01-23T14:13:20.989267029Z [inf]  resolve image config for docker-image://ghcr.io/railwayapp/railpack-frontend:v0.17.1
2026-01-23T14:13:21.081439591Z [inf]  load build definition from railpack-plan.json
2026-01-23T14:13:21.081475692Z [inf]  load build definition from railpack-plan.json
2026-01-23T14:13:21.081516249Z [inf]  load build definition from railpack-plan.json
2026-01-23T14:13:21.091790226Z [inf]  load build definition from railpack-plan.json
2026-01-23T14:13:21.131558979Z [inf]  pnpm install --frozen-lockfile --prefer-offline
2026-01-23T14:13:21.131582734Z [inf]  copy pnpm-lock.yaml
2026-01-23T14:13:21.131589093Z [inf]  copy package.json
2026-01-23T14:13:21.131595198Z [inf]  mkdir -p /app/node_modules/.cache
2026-01-23T14:13:21.131606615Z [inf]  npm i -g corepack@latest && corepack enable && corepack prepare --activate
2026-01-23T14:13:21.131612626Z [inf]  [railpack] secrets hash
2026-01-23T14:13:21.131618926Z [inf]  loading .
2026-01-23T14:13:21.131624528Z [inf]  copy /root/.local/state/mise
2026-01-23T14:13:21.131630490Z [inf]  copy /etc/mise/config.toml
2026-01-23T14:13:21.131638838Z [inf]  copy /usr/local/bin/mise
2026-01-23T14:13:21.131644470Z [inf]  copy /mise/installs
2026-01-23T14:13:21.131650024Z [inf]  copy / /app
2026-01-23T14:13:21.131660360Z [inf]  pnpm run build
2026-01-23T14:13:21.131666603Z [inf]  copy /mise/shims
2026-01-23T14:13:21.131675043Z [inf]  copy package.json
2026-01-23T14:13:21.131707123Z [inf]  [railpack] merge $packages:apt:runtime, $packages:mise, $build, $build
2026-01-23T14:13:21.131715118Z [inf]  copy /opt/corepack
2026-01-23T14:13:21.131721227Z [inf]  copy /app
2026-01-23T14:13:21.131727045Z [inf]  copy /root/.cache
2026-01-23T14:13:21.131732391Z [inf]  copy /app/node_modules
2026-01-23T14:13:21.131741978Z [inf]  loading .
2026-01-23T14:13:21.131752978Z [inf]  [railpack] secrets hash
2026-01-23T14:13:21.132412043Z [inf]  install apt packages: libatomic1
2026-01-23T14:13:21.132465120Z [inf]  create mise config
2026-01-23T14:13:21.132481853Z [inf]  loading .
2026-01-23T14:13:21.132492761Z [inf]  [railpack] secrets hash
2026-01-23T14:13:21.132520405Z [inf]  install mise packages: node
2026-01-23T14:13:21.158588014Z [inf]  [railpack] secrets hash
2026-01-23T14:13:21.240157439Z [inf]  loading .
2026-01-23T14:13:21.292394066Z [inf]  Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]

2026-01-23T14:13:21.301377599Z [inf]  Get:2 http://deb.debian.org/debian bookworm-updates InRelease [55.4 kB]

2026-01-23T14:13:21.30138985Z [inf]  Get:3 http://deb.debian.org/debian-security bookworm-security InRelease [48.0 kB]

2026-01-23T14:13:21.353224106Z [inf]  Get:4 http://deb.debian.org/debian bookworm/main amd64 Packages [8792 kB]

2026-01-23T14:13:21.409982764Z [inf]  Get:5 http://deb.debian.org/debian bookworm-updates/main amd64 Packages [6924 B]

2026-01-23T14:13:21.438658983Z [inf]  Get:6 http://deb.debian.org/debian-security bookworm-security/main amd64 Packages [292 kB]

2026-01-23T14:13:21.521331066Z [inf]  mise node@22.22.0    install

2026-01-23T14:13:21.52219188Z [inf]  mise node@22.22.0    download node-v22.22.0-linux-x64.tar.gz

2026-01-23T14:13:22.310375616Z [inf]  mise node@22.22.0    extract node-v22.22.0-linux-x64.tar.gz

2026-01-23T14:13:22.368035426Z [inf]  Fetched 9346 kB in 1s (8644 kB/s)
Reading package lists...
2026-01-23T14:13:22.773485833Z [inf]  

2026-01-23T14:13:22.79071458Z [inf]  Reading package lists...
2026-01-23T14:13:23.240181246Z [inf]  

2026-01-23T14:13:23.252713739Z [inf]  Building dependency tree...
2026-01-23T14:13:23.306195746Z [inf]  mise node@22.22.0    node -v

2026-01-23T14:13:23.309631687Z [inf]  mise node@22.22.0    v22.22.0

2026-01-23T14:13:23.310194297Z [inf]  mise node@22.22.0    npm -v

2026-01-23T14:13:23.356355164Z [inf]  
Reading state information...
2026-01-23T14:13:23.356414399Z [inf]  

2026-01-23T14:13:23.392623185Z [inf]  mise node@22.22.0    10.9.4

2026-01-23T14:13:23.398551874Z [inf]  mise node@22.22.0    enable corepack shims

2026-01-23T14:13:23.469831452Z [inf]  The following NEW packages will be installed:

2026-01-23T14:13:23.47040871Z [inf]    libatomic1

2026-01-23T14:13:23.471009546Z [inf]  mise node@22.22.0  ✓ installed

2026-01-23T14:13:23.487157812Z [inf]  0 upgraded, 1 newly installed, 0 to remove and 12 not upgraded.
Need to get 9376 B of archives.
After this operation, 46.1 kB of additional disk space will be used.
Get:1 http://deb.debian.org/debian bookworm/main amd64 libatomic1 amd64 12.2.0-14+deb12u1 [9376 B]

2026-01-23T14:13:23.578830976Z [inf]  debconf: delaying package configuration, since apt-utils is not installed

2026-01-23T14:13:23.580961093Z [inf]  install mise packages: node
2026-01-23T14:13:23.583047311Z [inf]  copy package.json
2026-01-23T14:13:23.599622918Z [inf]  Fetched 9376 B in 0s (714 kB/s)

2026-01-23T14:13:23.614983923Z [inf]  Selecting previously unselected package libatomic1:amd64.
(Reading database ... 
2026-01-23T14:13:23.616287696Z [inf]  (Reading database ... 5%
(Reading database ... 10%
(Reading database ... 15%
(Reading database ... 20%
(Reading database ... 25%
(Reading database ... 30%
(Reading database ... 35%
(Reading database ... 40%
(Reading database ... 45%
(Reading database ... 50%
(Reading database ... 55%
(Reading database ... 60%
(Reading database ... 65%
(Reading database ... 70%
2026-01-23T14:13:23.620362227Z [inf]  (Reading database ... 75%
2026-01-23T14:13:23.623215434Z [inf]  (Reading database ... 80%
2026-01-23T14:13:23.625916658Z [inf]  (Reading database ... 85%
2026-01-23T14:13:23.628489108Z [inf]  (Reading database ... 90%
2026-01-23T14:13:23.633173398Z [inf]  (Reading database ... 95%
2026-01-23T14:13:23.637106164Z [inf]  (Reading database ... 100%
(Reading database ... 6622 files and directories currently installed.)

2026-01-23T14:13:23.637493483Z [inf]  Preparing to unpack .../libatomic1_12.2.0-14+deb12u1_amd64.deb ...

2026-01-23T14:13:23.640247010Z [inf]  copy package.json
2026-01-23T14:13:23.640740293Z [inf]  Unpacking libatomic1:amd64 (12.2.0-14+deb12u1) ...

2026-01-23T14:13:23.642115473Z [inf]  npm i -g corepack@latest && corepack enable && corepack prepare --activate
2026-01-23T14:13:23.660901817Z [inf]  Setting up libatomic1:amd64 (12.2.0-14+deb12u1) ...

2026-01-23T14:13:23.666243999Z [inf]  Processing triggers for libc-bin (2.36-9+deb12u13) ...

2026-01-23T14:13:23.708622565Z [inf]  install apt packages: libatomic1
2026-01-23T14:13:23.838428162Z [inf]  npm warn config production Use `--omit=dev` instead.

2026-01-23T14:13:24.325990141Z [inf]  
changed 1 package in 510ms

2026-01-23T14:13:24.358548533Z [inf]  Reshimming mise 22.22.0...

2026-01-23T14:13:24.516831331Z [inf]  Preparing pnpm@9.15.2 for immediate activation...

2026-01-23T14:13:24.608637764Z [inf]  copy /mise/shims
2026-01-23T14:13:24.608668723Z [inf]  copy /mise/installs
2026-01-23T14:13:24.608678860Z [inf]  copy /usr/local/bin/mise
2026-01-23T14:13:24.608685798Z [inf]  copy /etc/mise/config.toml
2026-01-23T14:13:24.608695548Z [inf]  copy /root/.local/state/mise
2026-01-23T14:13:25.219127874Z [inf]  npm i -g corepack@latest && corepack enable && corepack prepare --activate
2026-01-23T14:13:25.220666307Z [inf]  mkdir -p /app/node_modules/.cache
2026-01-23T14:13:25.326120487Z [inf]  mkdir -p /app/node_modules/.cache
2026-01-23T14:13:25.327479115Z [inf]  copy package.json
2026-01-23T14:13:25.343918789Z [inf]  copy package.json
2026-01-23T14:13:25.345009460Z [inf]  copy pnpm-lock.yaml
2026-01-23T14:13:25.359793296Z [inf]  copy pnpm-lock.yaml
2026-01-23T14:13:25.361573885Z [inf]  pnpm install --frozen-lockfile --prefer-offline
2026-01-23T14:13:25.91923387Z [inf]  Lockfile is up to date, resolution step is skipped

2026-01-23T14:13:25.970466278Z [inf]  Progress: resolved 1, reused 0, downloaded 0, added 0

2026-01-23T14:13:26.052343865Z [inf]  Packages: +724
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

2026-01-23T14:13:26.979412588Z [inf]  Progress: resolved 724, reused 0, downloaded 239, added 234

2026-01-23T14:13:27.981153689Z [inf]  Progress: resolved 724, reused 0, downloaded 713, added 709

2026-01-23T14:13:28.981849795Z [inf]  Progress: resolved 724, reused 0, downloaded 721, added 720

2026-01-23T14:13:29.982127744Z [inf]  Progress: resolved 724, reused 0, downloaded 723, added 722

2026-01-23T14:13:30.645338865Z [inf]  Progress: resolved 724, reused 0, downloaded 724, added 724, done

2026-01-23T14:13:31.024655201Z [inf]  .../node_modules/protobufjs postinstall$ node scripts/postinstall

2026-01-23T14:13:31.025277685Z [inf]  .../core-js@3.47.0/node_modules/core-js postinstall$ node -e "try{require('./postinstall')}catch(e){}"

2026-01-23T14:13:31.192519892Z [inf]  .../node_modules/protobufjs postinstall: Done

2026-01-23T14:13:31.197029755Z [inf]  .../node_modules/@sentry/cli postinstall$ node ./scripts/install.js

2026-01-23T14:13:31.264287882Z [inf]  .../esbuild@0.27.2/node_modules/esbuild postinstall$ node install.js

2026-01-23T14:13:31.264817075Z [inf]  .../core-js@3.47.0/node_modules/core-js postinstall: Done

2026-01-23T14:13:31.331030447Z [inf]  .../node_modules/@sentry/cli postinstall: Done

2026-01-23T14:13:31.33262229Z [inf]  .../node_modules/unrs-resolver postinstall$ napi-postinstall unrs-resolver 1.11.1 check

2026-01-23T14:13:31.398570641Z [inf]  .../esbuild@0.27.2/node_modules/esbuild postinstall: Done

2026-01-23T14:13:31.442422499Z [inf]  .../node_modules/unrs-resolver postinstall: Done

2026-01-23T14:13:32.166544182Z [inf]  
dependencies:
+ @radix-ui/react-accordion 1.2.12
+ @radix-ui/react-alert-dialog 1.1.15
+ @radix-ui/react-checkbox 1.3.3
+ @radix-ui/react-collapsible 1.1.12
+ @radix-ui/react-dialog 1.1.15
+ @radix-ui/react-dropdown-menu 2.1.16
+ @radix-ui/react-label 2.1.8
+ @radix-ui/react-progress 1.1.8
+ @radix-ui/react-radio-group 1.3.8
+ @radix-ui/react-select 2.2.6
+ @radix-ui/react-slider 1.3.6
+ @radix-ui/react-slot 1.2.4
+ @radix-ui/react-switch 1.2.6
+ @radix-ui/react-toast 1.2.15
+ @sentry/nextjs 10.36.0
+ @supabase/ssr 0.8.0
+ @supabase/supabase-js 2.90.1
+ @upstash/ratelimit 2.0.8
+ @upstash/redis 1.36.1
+ class-variance-authority 0.7.1
+ clsx 2.1.1
+ date-fns 4.1.0
+ lucide-react 0.469.0
+ next 14.2.35
+ next-themes 0.4.6
+ node-cron 4.2.1
+ posthog-js 1.328.0
+ react 18.3.1
+ react-dom 18.3.1
+ recharts 3.7.0
+ resend 6.7.0
+ sonner 2.0.7
+ stripe 20.2.0
+ tailwind-merge 2.6.0
+ tailwindcss-animate 1.0.7
+ zod 4.3.5

devDependencies:
+ @playwright/test 1.57.0
+ @types/node 22.19.7
+ @types/node-cron 3.0.11
+ @types/react 18.3.27
+ @types/react-dom 18.3.7
+ autoprefixer 10.4.23
+ eslint 8.57.1
+ eslint-config-next 14.2.35
+ eslint-config-prettier 9.1.2
+ postcss 8.5.6
+ prettier 3.8.0
+ prettier-plugin-tailwindcss 0.6.14
+ tailwindcss 3.4.19
+ tsx 4.21.0
+ typescript 5.9.3


2026-01-23T14:13:32.187463592Z [inf]  Done in 6.6s

2026-01-23T14:13:32.664563926Z [inf]  pnpm install --frozen-lockfile --prefer-offline
2026-01-23T14:13:32.665755743Z [inf]  copy / /app
2026-01-23T14:13:33.166284719Z [inf]  copy / /app
2026-01-23T14:13:33.168389954Z [inf]  pnpm run build
2026-01-23T14:13:33.581049702Z [inf]  
> modeloptix@0.1.0 build /app
> next build


2026-01-23T14:13:34.3176883Z [inf]  [@sentry/nextjs] DEPRECATION WARNING: disableLogger is deprecated and will be removed in a future version. Use webpack.treeshake.removeDebugLogging instead.

2026-01-23T14:13:34.317841821Z [inf]  [@sentry/nextjs] DEPRECATION WARNING: automaticVercelMonitors is deprecated and will be removed in a future version. Use webpack.automaticVercelMonitors instead.

2026-01-23T14:13:34.377642868Z [inf]    ▲ Next.js 14.2.35

2026-01-23T14:13:34.377658678Z [inf]    - Experiments (use with caution):
    · instrumentationHook

2026-01-23T14:13:34.377741961Z [inf]  

2026-01-23T14:13:34.39015212Z [inf]     Creating an optimized production build ...

2026-01-23T14:13:34.74621434Z [inf]  [@sentry/nextjs] It appears you've configured a `sentry.server.config.ts` file. Please ensure to put this file's content into the `register()` function of a Next.js instrumentation file instead. To ensure correct functionality of the SDK, `Sentry.init` must be called inside of an instrumentation file. Learn more about setting up an instrumentation file in Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation. You can safely delete the `sentry.server.config.ts` file afterward.

2026-01-23T14:13:34.881799221Z [inf]  [@sentry/nextjs] It appears you've configured a `sentry.edge.config.ts` file. Please ensure to put this file's content into the `register()` function of a Next.js instrumentation file instead. To ensure correct functionality of the SDK, `Sentry.init` must be called inside of an instrumentation file. Learn more about setting up an instrumentation file in Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation. You can safely delete the `sentry.edge.config.ts` file afterward.

2026-01-23T14:13:34.883369684Z [inf]  [@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your `sentry.client.config.ts` file, or moving its content to `instrumentation-client.ts`. When using Turbopack `sentry.client.config.ts` will no longer work. Read more about the `instrumentation-client.ts` file: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

2026-01-23T14:13:55.042933265Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (200kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T14:13:55.068654019Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (139kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T14:13:55.074098449Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (131kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T14:13:55.075726962Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (135kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T14:14:05.344955472Z [inf]   ⚠ Compiled with warnings


2026-01-23T14:14:05.345013866Z [inf]  ./src/lib/sanity-check/service.ts
Attempted import error: 'runSanityCheck' is not exported from '@/lib/openrouter' (imported as 'runSanityCheck').

Import trace for requested module:
./src/lib/sanity-check/service.ts
./src/lib/sanity-check/index.ts
./src/app/api/sanity-checks/route.ts

./node_modules/.pnpm/@upstash+redis@1.36.1/node_modules/@upstash/redis/nodejs.mjs
A Node.js API is used (process.version at line: 71) which is not supported in the Edge Runtime.
Learn more: https://nextjs.org/docs/api-reference/edge-runtime

Import trace for requested module:
./node_modules/.pnpm/@upstash+redis@1.36.1/node_modules/@upstash/redis/nodejs.mjs
./src/lib/redis.ts
./src/lib/rate-limit.ts


2026-01-23T14:14:05.345885235Z [inf]     Linting and checking validity of types ...

2026-01-23T14:14:09.201243466Z [inf]  
./src/app/(dashboard)/layout.tsx
203:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/app/api/opportunities/[id]/route.ts
313:11  Warning: Unexpected console statement.  no-console

./src/app/api/webhooks/stripe/route.ts
69:9  Warning: Unexpected console statement.  no-console
93:3  Warning: Unexpected console statement.  no-console
136:3  Warning: Unexpected console statement.  no-console
158:7  Warning: Unexpected console statement.  no-console
174:3  Warning: Unexpected console statement.  no-console
178:5  Warning: Unexpected console statement.  no-console
219:3  Warning: Unexpected console statement.  no-console
231:7  Warning: Unexpected console statement.  no-console
250:3  Warning: Unexpected console statement.  no-console
260:5  Warning: Unexpected console statement.  no-console
281:3  Warning: Unexpected console statement.  no-console
292:3  Warning: Unexpected console statement.  no-console
311:5  Warning: Unexpected console statement.  no-console
337:3  Warning: Unexpected console statement.  no-console
356:5  Warning: Unexpected console statement.  no-console
374:3  Warning: Unexpected console statement.  no-console
411:3  Warning: Unexpected console statement.  no-console

./src/instrumentation.ts
18:7  Warning: Unexpected console statement.  no-console
26:7  Warning: Unexpected console statement.  no-console
47:7  Warning: Unexpected console statement.  no-console
51:9  Warning: Unexpected console statement.  no-console
57:9  Warning: Unexpected console statement.  no-console
66:9  Warning: Unexpected console statement.  no-console
72:9  Warning: Unexpected console statement.  no-console
84:9  Warning: Unexpected console statement.  no-console
95:9  Warning: Unexpected console statement.  no-console
107:9  Warning: Unexpected console statement.  no-console
114:9  Warning: Unexpected console statement.  no-console
121:7  Warning: Unexpected console statement.  no-console
122:7  Warning: Unexpected console statement.  no-console
123:7  Warning: Unexpected console statement.  no-console
126:7  Warning: Unexpected console statement.  no-console
127:7  Warning: Unexpected console statement.  no-console
128:7  Warning: Unexpected console statement.  no-console
129:7  Warning: Unexpected console statement.  no-console
130:7  Warning: Unexpected console statement.  no-console
131:7  Warning: Unexpected console statement.  no-console

./src/lib/artificial-analysis/client.ts
79:11  Warning: Unexpected console statement.  no-console
94:5  Warning: Unexpected console statement.  no-console
104:5  Warning: Unexpected console statement.  no-console

./src/lib/jobs/cleanup-expired-sessions.ts
28:3  Warning: Unexpected console statement.  no-console
40:3  Warning: Unexpected console statement.  no-console
43:3  Warning: Unexpected console statement.  no-console

./src/lib/jobs/cleanup-guest-sanity-checks.ts
37:3  Warning: Unexpected console statement.  no-console
61:3  Warning: Unexpected console statement.  no-console

./src/lib/jobs/generate-opportunities.ts
25:3  Warning: Unexpected console statement.  no-console
32:5  Warning: Unexpected console statement.  no-console

./src/lib/jobs/reaper.ts
38:3  Warning: Unexpected console statement.  no-console
56:5  Warning: Unexpected console statement.  no-console
60:3  Warning: Unexpected console statement.  no-console
84:7  Warning: Unexpected console statement.  no-console
91:3  Warning: Unexpected console statement.  no-console

./src/lib/jobs/runner.ts
60:9  Warning: Unexpected console statement.  no-console
69:5  Warning: Unexpected console statement.  no-console
115:5  Warning: Unexpected console statement.  no-console

./src/lib/jobs/sync-benchmarks.ts
125:3  Warning: Unexpected console statement.  no-console
139:5  Warning: Unexpected console statement.  no-console
164:5  Warning: Unexpected console statement.  no-console
205:5  Warning: Unexpected console statement.  no-console
208:5  Warning: Unexpected console statement.  no-console

./src/lib/jobs/sync-model-catalog.ts
40:3  Warning: Unexpected console statement.  no-console
67:5  Warning: Unexpected console statement.  no-console
85:5  Warning: Unexpected console statement.  no-console
119:5  Warning: Unexpected console statement.  no-console
122:5  Warning: Unexpected console statement.  no-console
227:9  Warning: Unexpected console statement.  no-console

./src/lib/jobs/sync-pricing.ts
30:3  Warning: Unexpected console statement.  no-console
42:5  Warning: Unexpected console statement.  no-console
75:5  Warning: Unexpected console statement.  no-console
121:5  Warning: Unexpected console statement.  no-console
124:5  Warning: Unexpected console statement.  no-console

./src/lib/jobs/trial-reminder.ts
39:3  Warning: Unexpected console statement.  no-console
70:5  Warning: Unexpected console statement.  no-console
80:3  Warning: Unexpected console statement.  no-console
153:7  Warning: Unexpected console statement.  no-console
166:3  Warning: Unexpected console statement.  no-console

./src/lib/openrouter/client.ts
54:9  Warning: Unexpected console statement.  no-console
88:7  Warning: Unexpected console statement.  no-console

./src/lib/recommendations/opportunity-generator.ts
230:3  Warning: Unexpected console statement.  no-console
390:7  Warning: Unexpected console statement.  no-console
726:3  Warning: Unexpected console statement.  no-console
737:5  Warning: Unexpected console statement.  no-console
769:5  Warning: Unexpected console statement.  no-console

./src/lib/savings/record-savings.ts
50:5  Warning: Unexpected console statement.  no-console

./src/middleware.ts
319:7  Warning: Unexpected console statement.  no-console
354:5  Warning: Unexpected console statement.  no-console

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules

2026-01-23T14:14:15.009306962Z [inf]  Failed to compile.


2026-01-23T14:14:15.009521598Z [inf]  ./src/lib/sanity-check/service.ts:11:10
Type error: Module '"@/lib/openrouter"' has no exported member 'runSanityCheck'.

[0m [90m  9 |[39m[0m
[0m [90m 10 |[39m [36mimport[39m { createServiceClient } [36mfrom[39m [32m'@/lib/supabase/service'[39m[33m;[39m[0m
[0m[31m[1m>[22m[39m[90m 11 |[39m [36mimport[39m { runSanityCheck } [36mfrom[39m [32m'@/lib/openrouter'[39m[33m;[39m[0m
[0m [90m    |[39m          [31m[1m^[22m[39m[0m
[0m [90m 12 |[39m [36mimport[39m type {[0m
[0m [90m 13 |[39m   [33mCreateSanityCheckRequest[39m[33m,[39m[0m
[0m [90m 14 |[39m   [33mSanityCheckWithDetails[39m[33m,[39m[0m

2026-01-23T14:14:15.115657276Z [inf]  Next.js build worker exited with code: 1 and signal: null

2026-01-23T14:14:15.271717858Z [inf]   ELIFECYCLE  Command failed with exit code 1.

2026-01-23T14:14:15.517438237Z [err]  pnpm run build
2026-01-23T14:14:15.532237083Z [err]  ERROR: failed to build: failed to solve: process "pnpm run build" did not complete successfully: exit code: 1
