import numpy as np
from PIL import Image
from pathlib import Path

output_dir = Path(__file__).parent

# Matrix for LFSR with 6 bits, tap between bit 6 and 5.
bits = 6
matrix = np.array([
    [0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0],
])

img = Image.fromarray(matrix.astype(np.uint8) * 255)
img = img.resize((bits * 4, bits * 4), resample=Image.NEAREST)
img.save(output_dir / "matrix_toy.png")
