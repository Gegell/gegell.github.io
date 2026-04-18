# Script to upscale the matrix image and split it into the 3 separate submatrices.
# The original image is 96x32 black & white.
# Upscales by 4 to avoid aliasing / blurring issues in the post.

from PIL import Image
from einops import rearrange, repeat
import numpy as np

img = Image.open("matrix_fwd_1.png")
img = np.array(img)

img = rearrange(img, "h (d w) -> d h w", d=3)
img = repeat(img, "d h w -> d (h s1) (w s2)", s1=4, s2=4)

for idx, img in enumerate(img):
    img = Image.fromarray(img)
    letter = chr(ord("A") + idx)
    img.save(f"matrix_fwd_1_{letter}.png")
