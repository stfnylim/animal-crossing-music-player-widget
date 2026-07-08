# NookOffice Notion Embed

This is a static GitHub Pages-ready rebuild of the NookOffice-style embed.

## Why this version should work better in Notion

- It does not attempt autoplay on page load.
- It loads YouTube only after the Play button is clicked.
- It removes the clipboard write and alert that ran automatically in the original `?embed=true` page.
- It uses relative asset paths, so it can live at any GitHub Pages repo path.

## Publish to GitHub Pages

1. Create a new public GitHub repository.
2. Upload all files in this folder to the repository root.
3. In GitHub, open `Settings > Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Select the `main` branch and `/ (root)`.
6. Use the published URL in Notion's `/embed` block.

## Notes

The background images and UI icons are local files. The hourly music and rain layer still use the official YouTube iframe player, because bundling the Animal Crossing audio files directly would require separate rights to redistribute those recordings.
