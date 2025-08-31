# Video.js Installation Instructions

## Install Video.js Package

Run this command in the `social_react` directory:

```bash
npm install video.js
```

## Alternative CDN Installation (if npm fails)

Add these to your `social_react/public/index.html`:

```html
<!-- Video.js CSS -->
<link href="https://cdn.jsdelivr.net/npm/video.js@8/dist/video-js.css" rel="stylesheet">

<!-- Video.js JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/video.js@8/dist/video.min.js"></script>
```

## Package.json Entry

Add this to your `package.json` dependencies:

```json
{
  "dependencies": {
    "video.js": "^8.5.2"
  }
}
```

## Verify Installation

After installation, you should be able to import Video.js:

```javascript
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
```
