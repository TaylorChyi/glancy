# Style Guide

This project uses **CSS Modules** to keep component styles isolated.
Common variables are defined under `src/theme` and imported across modules.

## Rules
- Always create a `.module.css` file for new components.
- Use variables like `--radius-md` and `--radius-lg` for border radius.
- Buttons share base styles defined in `index.css`.
- Modals should use `Modal.jsx` as wrapper and apply custom classes.

### Icons
SVG files are organized under `src/assets` in structured subdirectories (such as
`icons/`, `brand/`, and `logos/`) and are exported as React components from
`src/components/Icon`.
Use these components instead of `<img>` when adding icons:

```jsx
import { GoogleIcon } from '../components/Icon'

function Example() {
  return <GoogleIcon width={24} height={24} />
}
```

Future pull requests should follow these conventions.
