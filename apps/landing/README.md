# Brightlight

## Template Integrations
- Tailwind CSS v4  
- Astro SEO - Powered by [@astrolib/seo](https://github.com/onwidget/astrolib/tree/main/packages/seo)
- Astro Sitemap - https://docs.astro.build/en/guides/integrations-guide/sitemap/

## Template Structure

The template follows a typical Astro project structure. You'll find the following key directories and files:


```
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

- `src/pages/`: Contains `.astro` and `.md` files. Each file becomes a route in your project based on its name.
- `src/components/`: Ideal for placing your Astro/React/Vue/Svelte/Preact components.
- `public/`: For static assets such as images that you want to serve directly.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:3000`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

Learn more - Explore more through Astro's official [documentation](https://docs.astro.build).
------
Updated on 19th Aug 2025

### Optional CMS with pagesCMS

This theme includes a ready-to-use [PagesCMS](https://pagescms.org) config file (`.pages.yml`).
- Optional — delete the file if you don’t want CMS.  But you could keep in case you want to in the future, it won't affect the theme.
- Zero dependencies — it does not add anything to your code, build or installs.  
- Instant setup — if you want simple content editing, the config is already there. 

### Getting Started
1. Push your project to GitHub, GitLab, or Bitbucket.  
2. Go to [PagesCMS](https://pagescms.org/) and connect your repository.  
3. Your content (Markdown, images, etc.) will be editable through the CMS.  

Learn more:  
- [PagesCMS homepage](https://pagescms.org/)  
- [Configuration docs](https://pagescms.org/docs/configuration/)  

------
Updated on 17th May 2025
## On this update
- Full redesign

- Add Image component from Astro
The Astro Image component is coming back to the themes

- Reusable components
This template now includes reusable components, such as the `Text` component:

- Text Component  
A versatile and reusable component for handling text across your project, ensuring consistency and easy customization.  

- **HTML Tags:** Easily change the HTML element (like `p`, `h1`, `span`, `a`) using the `tag` prop, with `p` being the default.  
- **Variants:** Pick from preset text styles (such as `displayXL` or `textBase`) for a consistent look.  
- **Custom Classes:** Add or adjust styles with the `class` prop.  
- **Accessibility:** Customize with additional props like `id`, `href`, `title`, and `style`.  
- **Content Slot:** Add any content inside the component, including optional left and right icons. 
Example usage:
```astro
<Text tag="h1" variant="displayXL" class="text-center">
  Welcome to the new version!
</Text>
``` 

- Button Component  
A customizable button component with options to fit your design needs:  

- **Variants:** Choose from predefined styles like `primary` (dark background) and `secondary` (lighter background), with support for dark mode.  
- **Sizes:** Select `small` or `medium` for different button heights and padding.  
- **Gaps:** Control the spacing between content with the `gapSize` prop (either `small` or `medium`).  
- **Custom Classes:** Apply additional styles using the `class` prop.  
- **Slots:** Include icons or extra content with optional `left-icon` and `right-icon` slots. 

Example usage:
```astro
<Button size="small" variant="primary">Primary small</Button>
```

-  Wrapper Component  
A flexible layout component that helps with consistent spacing and alignment.  

- **Variants:** The default `standard` variant includes responsive widths, centered content, and padding.  
- **Custom Classes:** Add or change styles with the `class` prop.  
- **Content Slot:** Easily add any child components or content inside.

```astro
<Wrapper variant="standard">
Your content goes here
</Wrapper>
```

------
Updated on 31st December 2024

## This update includes:
- Added Tailwind CSS v4 Beta
On this version, Tailwind CSS is now beta version from Tailwind CSS V4, this means that there's no `tailwind.config.mjs` file anymore. From now on, all style will be added on the `css` file. You can find the styles on the `src/styles/global.css` file.
- Astro V5
This update includes Astro V5, which is a major update that includes several new features and improvements.


- Astro SEO by @astrolib/seo
This update includes the integration of the Astro SEO package by @astrolib/seo, is an integration that makes managing your SEO easier in Astro projects. It is fully based on the excellent Next SEO library


-----

### [Support](https://lexingtonthemes.com/legal/support/)
### [Documentation](https://lexingtonthemes.com/documentation/)
### [Get your bundle](https://lexingtonthemes.com)