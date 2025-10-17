from PIL import Image

# open image
img = Image.open("matrix_fwd_1.png")

# compute new size (4x)
new_size = (img.width * 4, img.height * 4)

# upscale
upscaled = img.resize(new_size, resample=Image.NEAREST)  # use NEAREST for pixel-perfect, or Image.LANCZOS for smooth

# save result
upscaled.save("output.png")
