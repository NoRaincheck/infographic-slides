# Future Features

## Partial Regeneration

The ability to re-run individual stages or refine specific slides without
regenerating the entire deck.

### Proposed CLI additions

```bash
# Regenerate only slide 3's design
npx infographic-slides refine --slide 3 --stage design

# Re-generate an illustration for slide 5
npx infographic-slides refine --slide 5 --stage illustration

# Re-render a single slide after editing its artifact JSON
npx infographic-slides refine --slide 3 --stage render

# Edit the story and cascade changes
npx infographic-slides refine --stage story
```

### Implementation notes

- Each artifact JSON is the source of truth; editing it + re-running the
  affected stage should produce correct output
- `refine` subcommand reads existing artifacts, applies changes, and only
  re-runs downstream stages
- A `--cascade` flag (default true) would automatically re-run stages 3-6
  when stage 2 is modified

### Artifact schema versioning

- Add a `version` field to each artifact JSON
- Schema migrations ensure old artifacts remain compatible

## Interactive Mode

Step-by-step wizard where the user reviews each artifact before proceeding.

```bash
npx infographic-slides "quantum computing" --interactive
```

Would show:
1. Mindmap tree (accept / regenerate / edit)
2. Story plan (accept / regenerate / reorder slides)
3. Slide designs (accept / swap template / regenerate individual)
4. Illustration decisions (approve / modify prompts)
5. Rendered PNGs (accept / re-render / edit image)

## Additional Features

- PowerPoint/PDF export
- Template customization (custom color palettes, fonts)
- Batch mode (multiple topics in one run)
- Voice narration overlay
- Animation transitions between slides
