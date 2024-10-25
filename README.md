# VueFlowFast - Vue 3 template to get you into the flow fast with unplugin super powers

**A pre-configured Vue 3+Vite 3 project for quickly deploying ideas using highly readable SFCs.**

Inspired by the Vitesse repos, this is a baseline repo to clone as a start for a new Vue 3 project. It leverages many of the unplugin packages and helpers like Pug to remove much of the clutter from the SFCs and lets you focus on your app fast and stay in the flow.


## Features

- Stripped down, but fully functional, directory structure to simplify navigating project files
- File-based routing to simplify adding pages to your app
- Pug integration to allow for clean <template lang="pug"> blocks
- Unplugin auto imports of components, functions, and composables for clean <script setup> blocks
- Tailwind CSS utility classes often eliminate the need for a <style> block
- Easily use all [Icônes](https://icones.js.org/) icon sets thanks to Iconify (via unplugin-icons) 
- Vuestic UI provides a cohesive component library to build quickly


## How to Use

```bash
git clone https://github.com/WayneBuckhanan/VueFlowFast <your-project-name>
cd <your-project-name>
npm install
npm run dev
```

**That's it.** You're hot-loading changes, getting into the coding flow, and ready to build your app that fast.

Add pages as Vue SFCs to create routes in your app that match the file structure in `src/pages/`.

Use component SFCs from `src/components/` in your template blocks without importing them.

Add or adjust the default and blank page layouts in `src/layouts/`.

Control page layout, title, and more in a simple route block in your SFC.

And when you want, you can dig into these files as well:

- `package.json` - update the project name and version fields (or run `npm init` to be prompted)
- `public/favicon.ico` - replace with your .ico file or a [favicon.io](https://favicon.io) package
- `src/index.css` - manage global font imports and global styles
- `src/main.js` - update DEFAULT_PAGE_TITLE, router settings, Vuestic UI settings, etc
- `tailwind.config.js` - set breakpoints, add additional Tailwind plugins, etc
- `vite.config.js` - adjust build settings and un/plugin configs

But that's about it. Everything else has been simplified and consolidated. That's the power of the unplugins!

When you're ready to deploy, you can generate the bundled, tree-shaken files to `dist/`.

```bash
npm run build
```

Then you can transfer the file structure from `dist/` to any place that can host static files such as shared hosting accounts, appropriately configured Amazon S3 buckets, and Cloudflare Pages projects.


## Project Structure

```
/
├── public/         static file structure copied untouched into `dist/` on `npm run build`
├── src/
│   ├── components  your app components, auto imported to be used in other components including page SFCs
│   ├── layouts     page layouts, can be specified per-page or fall back to the `default.vue` layout
│   ├── pages       file-based routes, SFCs get wrapped in a layout and become the app's pages
└── dist/           ready to deploy file structure generated by `npm run build`
```

Each SFC in `src/pages/` defines a page in your app. Page SFCs have the usual Vue SFC tags (template, script, style) and an additional `<route>` tag to set meta fields for the router such as the layout to use and the page title. Route blocks currently default to YAML syntax, but can be specified with a `lang` or configured to default to JSON or JSON5.

The majority of the Vue configuration is in `src/main.js`. Much like our auto imports simplified our SFC, the file-based routing simplifies our Vue Router config. That means unweildy config that might have been in files like `src/router/index.js` is brief enough that we can consolidate it as a config block into the main.js. Keeping all the config together makes it faster to find and easier to see all the supporting packges and their configurations in one place.

The less Vue-centric configs are located in the root directory as `*.config.js` files. The vite and tailwind configs have comments explaining most of the config choices made and lists many of the default values you might want to adjust. Other configs are auto generated and should be at defaults from the packages that generated them.


### Caveats and Notes

- Due to the auto import of components, you cannot have SFCs anywhere in `src/pages/` or `src/components` with the same name. This includes in subdirectories or with equivalent PascalCase and kebab-case names. E.g. `src/pages/blog/thing-one.vue` will conflict with `src/pages/product/thing-one.vue` and with `src/components/widgets/ThingOne.vue`.
- In dev mode, updating the `<route>` tag or contents of a layout file typically isn't picked up by the Hot Module Replacement (HMR) and requires a manual restart of the Vite server ('r<Enter>' on the Vite console) to see the changes.
- If you'd prefer the `src/views/` convention to house the page SFCs, you can symlink or rename `pages` and uncomment the appropriate lines in the `Layouts` and `VueRouter` sections of the `vite.config.js` in the project root.
- Tailwind CSS, PostCSS, and AutoPrefixer are indirectly included by way of the `vitawind` package. If you want a version of one of those that is more recent than what vitawind includes, you can use npm to install them directly.
- Tailwind CSS and Vuestic UI breakpoints and colors can be synchronized in either direction. See the [Vuestic UI docs](https://ui.vuestic.dev/styles/tailwind) for more details.
- If you would prefer a different UI toolkit than Vuestic UI, simply remove the vuestic-ui package and the config block in `src/main.js`. You'll want to make sure you are not using any of the Va* components. The only files that should reference Vuestic UI components are the default layout and the SidebarContents component it uses.

## Possible Add-Ons

### Setting page values

The unplugins we're using allow for a number of overrides on the page level via the `<route>` tag. This tag functions much like frontmatter blocks in Markdown-based site generators. The repo is already configured to allow for a non-default page layout (via vite-plugin-vue-layouts) to be specified in the `meta` section of the `<route>` tag. 

You can add other fields besides `layout` to be used in your router config. Below, we're setting the `document.title` based on the route's `meta.title` that was set in the `<route>` tag.

```js
// from src/main.js
router.beforeEach((to)=> {
  document.title = to?.meta?.title ? to.meta.title : 'Default App Title'
})
```

This is how we can override the default page title that would have been defined in the `index.html` file in the project root. This also demonstrates how other fields could be specified in the route block of a page SFC to update the document directly. Any fields added to the `<route>` tag are available in the Vue Router and can be used to update the page. See the [unplugin-vue-router docs](https://uvr.esm.is/guide/extending-routes.html#sfc-route-custom-block) for more.

Route params can also be configured by naming our files with placeholders to allow the client-side router to choose which page SFC to use for matching paths. The SFC can then access any bracketed match as a named route param. For example, naming our SFC `src/pages/user/[userName].vue` would load that same file for any matching paths like `/user/Alice` or `/user/Bob` and fill the `userName` param with the appropriate value. See the `src/pages/[...default404].vue` page for an example with `useRouter()` accessing the matched path and including its value in the 404 page template.


### Adding Pinia stores

Create a `src/stores` directory and include your store definitions there. There is already a commented stub in the `vite.config.js` file showing how to enable auto-import of a store's composable.

Add the following snippet to the `src/main.js` file between `createApp()` and `app.mount()`:

```js
// Pinia Config in src/main.js
import { createPinia } from 'pinia'
app.use(createPinia())
```


### Auth Gating

If you've got authentication in your app and want to gate pages as requiring a logged in user, you can add the snippet below to your `src/main.js` before `app.use(router)`. If you aren't using an auth solution that provides a promise-based `getCurrentUser()`, you'll want to adjust the code below.

For each page that should be auth-only, add a truthy `requiresAuth` value to the meta value in the route tag.

```js
// Add to src/main.js
router.beforeResolve(async (to, from, next) => {
  let redirectPath = null
  if (to.query.redirect && (to.query.redirect !== to.path)) {
    redirectPath = to.query.redirect
  }
  if (to.matched.some(record => record.meta.requiresAuth)) {
    try {
      const user = await getCurrentUser()
      if(redirectPath) { next(redirectPath) } else { next() }
    } catch (error) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    if(redirectPath) { next(redirectPath) } else { next() }
  }
})
```

One use-case for this pattern is using the AWS Amplify libraries and components to interface with services like Cognito and API Gateway. You do not need to be using the Amplify layer of services on AWS to use the Amplify functions, components, and UI elements in your Vue project. You can include a manually drafted Amplify configuration block and initialization in the `src/main.js` file and then get access to the Authenticator component and API calling helper functions from Amplify libraries. Whether the benefits are worth the overhead is an exercise left to the reader.


### Consider complementary packages

This repo is for getting into flow fast with your Vue project. Once you've built something worth maintaining, we highly recommend adding the following support packages:

- Code quality: eslint, prettier
- Testing: vitest, @vue/test-utils, cypress

Additionally, you may find that you need or want to define more complex CSS than the Tailwind utility classes easily provide. Stylus can be added for Pug-like features in your CSS blocks with no additional config needed. Simply run `npm install stylus` and use it in your `<style lang="stylus">` tags.

Backend services can be added with a single config file via [SST](https://sst.dev). For example, Javascript or Typescript functions can be defined in files in an `api/` directory and deployed to Amazon AWS, Cloudflare, or other services supported by SST or the underlying Pulumi providers. See the [examples in the SST docs](https://sst.dev/docs) for more ideas on how to leverage this "infrastructure as code" (IaC) approach to complement this repo's quick front-end development with quick back-end services as well.


## License

[MIT License](LICENSE.md)

Copyright (C) 2024 Wayne Buckhanan

