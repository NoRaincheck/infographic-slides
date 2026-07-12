#!/usr/bin/env python
"""
BiRefNet Background Removal — Image Processing

Uses BiRefNet (Bilateral Reference Network) ONNX model via onnxruntime
to produce transparent PNGs from images with backgrounds removed.

Usage:
    # Single file
    python models/birefnet_removal.py --input in.png --output out.png
    # Batch directory
    python models/birefnet_removal.py --input-dir assets/images/cards --output-dir assets/images/cards_transparent
"""

import argparse
import time
from pathlib import Path
import numpy as np
import cv2 as cv
import onnxruntime as ort

PROJECT_ROOT = Path(__file__).parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "birefnet.onnx"

MODEL_SIZE = 1024
IMAGE_NET_MEAN = [0.485, 0.456, 0.406]
IMAGE_NET_STD = [0.229, 0.224, 0.225]


def load_session():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}\nRun: python download_models.py")
    print(f"Loading BiRefNet model from {MODEL_PATH}")
    sess = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    input_name = sess.get_inputs()[0].name
    print(f"  Input: {sess.get_inputs()[0].name} {sess.get_inputs()[0].shape}")
    return sess, input_name


def remove_background(sess, input_name, image_path):
    img = cv.imread(str(image_path))
    if img is None:
        print(f"  Could not read: {image_path}")
        return None
    h, w = img.shape[:2]

    blob = cv.dnn.blobFromImage(
        img, scalefactor=1.0 / 255.0, size=(MODEL_SIZE, MODEL_SIZE),
        mean=IMAGE_NET_MEAN, swapRB=True, crop=False
    )
    blob[0, 0] /= IMAGE_NET_STD[0]
    blob[0, 1] /= IMAGE_NET_STD[1]
    blob[0, 2] /= IMAGE_NET_STD[2]

    logits = sess.run(None, {input_name: blob})[0]
    alpha = 1.0 / (1.0 + np.exp(-logits[0, 0]))
    alpha = cv.resize(alpha, (w, h), interpolation=cv.INTER_LINEAR)
    alpha = (alpha * 255).astype(np.uint8)

    bgra = cv.cvtColor(img, cv.COLOR_BGR2BGRA)
    bgra[:, :, 3] = alpha
    return bgra


def process_single(sess, input_name, input_path, output_path):
    t0 = time.time()
    result = remove_background(sess, input_name, input_path)
    if result is None:
        print(f"Failed to process: {input_path}")
        return False
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv.imwrite(str(output_path), result)
    elapsed = time.time() - t0
    print(f"  {input_path.name} ({result.shape[1]}x{result.shape[0]}) - {elapsed:.2f}s")
    return True


def process_batch(sess, input_name, input_dir, output_dir):
    images = sorted(input_dir.glob("*.png"))
    if not images:
        print(f"No PNG images found in {input_dir}")
        return

    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Processing {len(images)} images from {input_dir}")
    print(f"Output: {output_dir}\n")

    start = time.time()
    for i, img_path in enumerate(images, 1):
        t0 = time.time()
        result = remove_background(sess, input_name, img_path)
        if result is not None:
            out_path = output_dir / img_path.name
            cv.imwrite(str(out_path), result)
            elapsed = time.time() - t0
            print(f"  [{i}/{len(images)}] {img_path.name} ({result.shape[1]}x{result.shape[0]}) - {elapsed:.2f}s")

    total = time.time() - start
    print(f"\nDone! {len(images)} images processed in {total:.1f}s")
    print(f"Output: {output_dir}/")


def main():
    parser = argparse.ArgumentParser(description="Background removal for images")
    parser.add_argument("--input", help="Single input image file")
    parser.add_argument("--output", help="Single output image file")
    parser.add_argument("--input-dir", default=str(PROJECT_ROOT / "assets" / "images" / "cards"),
                        help="Directory containing card images (default: assets/images/cards)")
    parser.add_argument("--output-dir", default=str(PROJECT_ROOT / "assets" / "images" / "cards_transparent"),
                        help="Directory to save transparent PNGs (default: assets/images/cards_transparent)")
    args = parser.parse_args()

    if args.input:
        if not args.output:
            print("--output is required when using --input")
            return
        input_path = Path(args.input)
        output_path = Path(args.output)
        if not input_path.exists():
            print(f"Input file not found: {input_path}")
            return
        sess, input_name = load_session()
        ok = process_single(sess, input_name, input_path, output_path)
        if not ok:
            return
    else:
        input_dir = Path(args.input_dir)
        output_dir = Path(args.output_dir)
        if not input_dir.exists():
            print(f"Input directory not found: {input_dir}")
            return
        sess, input_name = load_session()
        print()
        process_batch(sess, input_name, input_dir, output_dir)


if __name__ == "__main__":
    main()
