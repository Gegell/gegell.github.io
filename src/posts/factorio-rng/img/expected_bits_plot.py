import numpy as np
import matplotlib.pyplot as plt

line_width = 2.5
color = "#ff8800"

# Define function
def f(p):
    return np.floor(-np.log2(p)) * p + np.floor(-np.log2(1 - p)) * (1 - p)

# Domain excluding 0 and 1
p = np.linspace(1e-6, 1 - 1e-6, 20000)
y = f(p)

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
plt.plot(p_plot, y_plot, color=color, linewidth=line_width)

# Compute function values and limits at dyadics
filled_x = []
filled_y = []
empty_x = []
empty_y = []

for d in dyadics:
    if d <= 0 or d >= 1:
        continue
    val = f(d)
    filled_x.append(d)
    filled_y.append(val)

    # Left and right limits
    eps = 1e-12
    left_val = f(d - eps) if d - eps > 0 else None
    right_val = f(d + eps) if d + eps < 1 else None

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
plt.scatter(filled_x, filled_y, facecolors=color, edgecolors=color,
            linewidths=line_width, zorder=3, s=30*line_width, marker="o")

# Scatter outlined dots (limits)
plt.scatter(empty_x, empty_y, facecolors="white", edgecolors=color,
            linewidths=line_width, zorder=3, s=30*line_width, marker="o")

# Labels
plt.xlabel("$p$")
plt.ylabel(r"$\mathbb{E}[\mathrm{bits}]$")
plt.title(r"Expected Bits observed for Events of Probability $p$")
plt.grid(True, linestyle="--", alpha=0.6)

# Save as SVG
svg_path = "./expected_bits_plot.svg"
plt.savefig(svg_path, format="svg")
plt.show()
plt.close()
