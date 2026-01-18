# Figures (Mermaid)

This folder contains Mermaid diagrams, sample metrics, and drafts for the UUD observation-layer study.

## Files
- `uud-observation-layer.mmd`: Conceptual architecture (observation layer → inference layer).
- `uud-ablation-xy.mmd`: Ablation summary (generalization gap).
- `uud-stability-xy.mmd`: Method rank stability summary.
- `metrics.sample.json`: Sample values for charts.
- `generate-figures.mjs`: Regenerates the XY charts from sample values.

## Usage
Embed in Markdown:

```mermaid
%% include the contents of the .mmd file
```

Or open the `.mmd` files directly in VS Code to preview.

## Render Mermaid for LaTeX
LaTeX files in this folder expect PNGs in `images/`.

Sample commands (run from this folder):

- `npx -y @mermaid-js/mermaid-cli -i uud-observation-layer.mmd -o images/uud-observation-layer.png`
- `npx -y @mermaid-js/mermaid-cli -i uud-ablation-xy.mmd -o images/uud-ablation-xy.png`
- `npx -y @mermaid-js/mermaid-cli -i uud-stability-xy.mmd -o images/uud-stability-xy.png`

## Optional: Build PDF
If you want a PDF output, compile the LaTeX files from this folder:

- `pdflatex UUD_OBSERVATION_LAYER_CLEAN_JP.tex`
- `pdflatex UUD_OBSERVATION_LAYER_CLEAN_EN.tex`

## Replace placeholder values
The current chart values are illustrative placeholders (realistic ranges) and should be replaced with measured results.

Update the bar values and axis ranges in:
- `uud-ablation-xy.mmd`
- `uud-stability-xy.mmd`

## Sample metrics and generator
Sample values are stored in [metrics.sample.json](metrics.sample.json).
You can regenerate the two XY charts with [generate-figures.mjs](generate-figures.mjs).

Then re-open the Mermaid preview to refresh.
