#!/usr/bin/env python3
"""
EmoSense Cloud/Local CNN Training Pipeline
─────────────────────────────────────────
Loads the accumulated emosense-dataset/, splits it into training/validation,
and trains a lightweight Convolutional Neural Network (CNN) for expression recognition.

Saves the outputs as a Keras (.keras) bundle in the repository root.
"""

import os
import sys
from pathlib import Path

# Force CPU training when executing on standard GitHub Actions runners
# (GHA free runners do not have GPUs, and forcing CPU prevents CUDA init lag/errors)
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

# Silence TensorFlow warnings to keep MLOps logs clean
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

try:
    import tensorflow as tf
except ImportError:
    print("[TensorFlow] Missing. Attempting to install tensorflow...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflow"])
    import tensorflow as tf

BATCH_SIZE = 32
IMAGE_SIZE = (96, 96)
EPOCHS = 25

def main():
    print("--- EmoSense Automated CNN Training Pipeline ---")
    print(f"TensorFlow Version: {tf.__version__}")
    
    # Locate dataset directory (relative to this script's path)
    base_dir = Path(__file__).resolve().parent / 'emosense-dataset'
    
    if not base_dir.exists():
        print(f"Error: Dataset directory not found at {base_dir.resolve()}")
        print("Please run sync_supabase.py first to populate the dataset.")
        sys.exit(1)
        
    # Verify we have subfolders containing images
    subdirs = [d for d in base_dir.iterdir() if d.is_dir() and d.name in ['happy', 'neutral', 'sad', 'angry']]
    total_images = 0
    valid_subdirs = []
    
    for subdir in subdirs:
        # Check sub-cultural folders (ZW, CN, INT)
        sub_files = list(subdir.glob('**/*.png'))
        if len(sub_files) > 0:
            total_images += len(sub_files)
            valid_subdirs.append(subdir.name)
            
    print(f"Detected subdirectories with samples: {valid_subdirs}")
    print(f"Total representative images found: {total_images}")
    
    if total_images < 5:
        print("Warning: Not enough samples collected in the database to train a robust model yet.")
        print("Required: Minimum 5 total samples to prevent overfitting and compilation crashes.")
        print("Skipping training cycle. The active model will remain unchanged.")
        sys.exit(0)

    print("\nLoading dataset directories into memory...")
    try:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            str(base_dir),
            validation_split=0.2,
            subset="training",
            seed=123,
            image_size=IMAGE_SIZE,
            batch_size=BATCH_SIZE,
            label_mode='categorical'
        )
        
        val_ds = tf.keras.utils.image_dataset_from_directory(
            str(base_dir),
            validation_split=0.2,
            subset="validation",
            seed=123,
            image_size=IMAGE_SIZE,
            batch_size=BATCH_SIZE,
            label_mode='categorical'
        )
        
        class_names = train_ds.class_names
        num_classes = len(class_names)
        print(f"Dataset classes successfully mapped ({num_classes} folders): {class_names}")
        
    except Exception as e:
        print(f"Fatal error loading dataset: {e}")
        sys.exit(1)

    # Optimize dataset loading for CPU training
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    # ── DEFINE CNN ARCHITECTURE ───────────────────────────────────────────────
    print("\nBuilding Convolutional Neural Network (CNN)...")
    model = tf.keras.models.Sequential([
        # Rescale inputs from [0, 255] to [0, 1]
        tf.keras.layers.Rescaling(1./255, input_shape=(96, 96, 3)),
        
        # Conv Block 1
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Dropout(0.25),
        
        # Conv Block 2
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Dropout(0.25),
        
        # Conv Block 3
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Dropout(0.4),
        
        # Classification Head
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.summary()

    # ── FIT MODEL ─────────────────────────────────────────────────────────────
    print(f"\nTraining model for {EPOCHS} epochs in the cloud...")
    try:
        model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=EPOCHS,
            verbose=2 # Cleaner logging output in CI environment
        )
    except Exception as e:
        print(f"Training failed: {e}")
        sys.exit(1)

    # ── SAVE MODEL ────────────────────────────────────────────────────────────
    # Save the output file in the project's root folder
    project_root = Path(__file__).resolve().parent.parent
    output_path = project_root / 'emosense_model.keras'
    
    print(f"\nSaving Keras weights to {output_path.resolve()}...")
    try:
        model.save(str(output_path))
        print("Training successfully finished! Ready for TFJS conversion.")
    except Exception as e:
        print(f"Error saving Keras model: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
