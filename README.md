# Dronacharya's Training

A personalized skill-development website inspired by Dronacharya's gurukul and the Mahabharata.
It is a static site (plain HTML, CSS and JavaScript). No build step or install is needed.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: the story, the problem, principles, research, the training simulator, learning path, progress tracking and impact |
| `gurukul.html` | Enter the Gurukul: environment gallery, Meet Your Guru, core values and "Start Your Assessment" |
| `parvas.html` | The 18 Parvas: a scroll-animated timeline of all 18 books and an MCQ assessment with recovery navigation and scoring |

## Features

- **Training arena:** an archery challenge (hold to draw, release to shoot) and a Bird's-Eye focus challenge, with adaptive levels from Beginner to Master and instant feedback.
- **Parva assessment:** 18 questions, one per Parva. A wrong answer sends you back to the exact event in the timeline, then returns you to the same question.
  - 10 points for a correct first try, 5 after one review, 2 after more.
  - +3 bonus for every three first-try answers in a row.
- **Progress tracking:** results are stored in the browser (`localStorage`) on the learner's device.
- **Scroll animations:** reveal-on-scroll, parallax banners, a scroll-linked timeline and animated charts. These respect the visitor's reduced-motion setting.

## Project structure

```
index.html  gurukul.html  parvas.html
css/        style.css (shared)  home.css (home page)  parvas.css (timeline page)
js/         icons.js  main.js  arena.js  parvas.js  parvas-data.js
assets/     favicon.svg
  img/      gurukul page backgrounds
  img/home/     home page banners and character cards
  img/parvas/   timeline illustrations
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 5173
```

Then visit http://localhost:5173.

## Deploy

The repository root is the site root, so any static host works with no configuration.

- **Vercel:** import the repository, choose the "Other" framework preset, leave the build command empty and keep the output directory as the root.
- **Netlify:** add a new site from Git. Leave the build command empty and set the publish directory to `/`.
- **GitHub Pages:** go to Settings → Pages, then choose Deploy from a branch → `main` / root.

## Image credits

The 18 Parva illustrations come from third-party websites. Each source is listed in the "Image sources" section at the bottom of `parvas.html`. Check each image's licence before publishing the site publicly.
