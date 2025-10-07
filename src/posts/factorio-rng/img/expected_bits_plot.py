import numpy as np
import matplotlib.pyplot as plt
import matplotlib as mpl
from pathlib import Path
from io import StringIO

OUT_PATH = Path(__file__).parent

line_color = "#ff8800"
text_color = "#111112"
grid_color = "#888889"
background_color = "#fffffe"

mpl.rcParams.update({
    "svg.fonttype": "none",   # keep text as text nodes in SVG
    "axes.titlesize": 16,     # title size
    "axes.titlepad": 15,      # title padding
    "axes.labelsize": 12,     # x/y label size
    "xtick.labelsize": 12,    # x tick labels
    "ytick.labelsize": 12,    # y tick labels
    # BG color (for light/dark mode)
    "figure.facecolor": "none",
    "axes.facecolor": "none",
    "grid.color": grid_color,
    "text.color": text_color,
    "axes.labelcolor": text_color,
    "xtick.color": text_color,
    "ytick.color": text_color,
    "axes.edgecolor": text_color,
    # Font
    "font.family": "sans-serif",
    "font.sans-serif": ["DejaVu Sans"],

})

line_width = 2.5

# Define function
def bit_function(p):
    return np.floor(-np.log2(p)) * p + np.floor(-np.log2(1 - p)) * (1 - p)

# Domain excluding 0 and 1
p = np.linspace(1e-6, 1 - 1e-6, 20000)
y = bit_function(p)

# Identify dyadic rationals for discontinuities
max_power = 10
dyadics = []
for n in range(1, max_power + 1):
    dyadics.append(2**-n)
    dyadics.append(1 - 2**-n)
dyadics = np.array(sorted(set(dyadics)))

# Remove dyadic points from plot line by inserting NaNs (to break vertical jumps)
p_plot = p.copy()
y_plot = y.copy()
for d in dyadics:
    idx = np.argmin(np.abs(p - d))
    y_plot[idx] = np.nan  # break the line at discontinuity

# Plot function with thicker line
plt.figure(figsize=(10, 6))
plt.plot(p_plot, y_plot, color=line_color, linewidth=line_width)

# Compute function values and limits at dyadics
filled_x = []
filled_y = []
empty_x = []
empty_y = []

for d in dyadics:
    if d <= 0 or d >= 1:
        continue
    val = bit_function(d)
    filled_x.append(d)
    filled_y.append(val)

    # Left and right limits
    eps = 1e-12
    left_val = bit_function(d - eps) if d - eps > 0 else None
    right_val = bit_function(d + eps) if d + eps < 1 else None

    # Left-continuous at p=2^-n, right-continuous at p=1-2^-m
    if np.isclose(d, 2**-np.round(-np.log2(d))):  # of form 2^-n
        if right_val is not None:
            empty_x.append(d)
            empty_y.append(right_val)
    else:  # of form 1-2^-m
        if left_val is not None:
            empty_x.append(d)
            empty_y.append(left_val)

# Scatter filled dots (larger, with edge for emphasis)
plt.scatter(filled_x, filled_y, facecolors=line_color, edgecolors=line_color,
            linewidths=line_width, zorder=3, s=30*line_width, marker="o")

# Scatter outlined dots (limits)
plt.scatter(empty_x, empty_y, facecolors=background_color, edgecolors=line_color,
            linewidths=line_width, zorder=3, s=30*line_width, marker="o")

# Labels
plt.xlabel("Event likelihood $p$")
plt.ylabel(r"Expected #Bits $E(p)$")
plt.title(r"Expected Bits observed for Events of Probability $p$")
plt.grid(True, linestyle="--", alpha=0.6)
plt.tight_layout()

# Custom x-ticks
k = 5
pows = 2.0**np.arange(-k, -1)
xticks = [0] + pows.tolist() + [0.5] + (1 - pows).tolist() + [1]
plt.xticks(xticks)
# Label them with 2^-n and 1-2^-n 
xtick_labels = ["0"] + [f"$\\frac{{1}}{{{2**n}}}$" for n in range(k, 0, -1)] + \
               [f"$\\frac{{{2**n-1}}}{{{2**n}}}$" for n in range(k, 1, -1)] + ["1"]
plt.gca().set_xticklabels(xtick_labels)

# Save as SVG
svg_path = OUT_PATH / "expected_bits_plot.svg"
str_buf = StringIO()
plt.savefig(str_buf, format="svg")

# Postprocess the SVG to replace colors with css variables
svg_content = str_buf.getvalue()
str_buf.close()
svg_content = svg_content.replace(line_color, f"var(--brand, {line_color})")
svg_content = svg_content.replace(text_color, f"var(--text-1, {text_color})")
svg_content = svg_content.replace(grid_color, f"var(--text-2, {grid_color})")
svg_content = svg_content.replace(background_color, f"var(--background, {background_color})")
# TODO replace font-family
with open(svg_path, "w", encoding="utf-8") as f:
    f.write(svg_content)

plt.show()
plt.close()
