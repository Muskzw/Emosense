import os
import sys
import shutil
from types import ModuleType

# Mock tensorflow_hub to avoid compatibility/dependency issues with TF 2.21+
mock_hub = ModuleType("tensorflow_hub")
sys.modules["tensorflow_hub"] = mock_hub

import numpy as np
# Bypass numpy's strict __getattr__ deprecation checks in NumPy 1.25+
for attr in ['object', 'bool', 'float', 'complex', 'str', 'int']:
    if attr in np.__dict__.get('__former_attrs__', {}):
        del np.__former_attrs__[attr]

np.object = np.object_
np.bool = np.bool_
np.int = int
np.float = float

import tensorflow as tf
import tensorflowjs as tfjs

# Source Paths (Trash locations)
trash_base = "/home/elon/.local/share/Trash/files/backend"
sources = {
    "zw/down_up": os.path.join(trash_base, "black/models/down_up/final_emotion_model.keras"),
    "zw/happy_neutral": os.path.join(trash_base, "black/models/happy_neutral/best_model.keras"),
    "zw/anger_sad": os.path.join(trash_base, "black/models/anger_sad/best_model.keras"),
    "cn/up_down": os.path.join(trash_base, "chinese/models/up_down/final_emotion_model.keras"),
    "cn/happy_neutral": os.path.join(trash_base, "chinese/models/happy_neutral/final_emotion_model.keras"),
    "cn/anger_sad": os.path.join(trash_base, "chinese/models/anger_sad/final_emotion_model.keras")
}

# Output base directory
output_base = "/home/elon/Documents/Emosense/frontend/public/models"
temp_saved_model_dir = "/home/elon/Documents/Emosense/temp_saved_model"

print("--- EmoSense Model Conversion Tool (SavedModel Bridge) ---")
print(f"TensorFlow version: {tf.__version__}")

for key, src_path in sources.items():
    print(f"\nProcessing {key}...")
    dest_dir = os.path.join(output_base, key)
    os.makedirs(dest_dir, exist_ok=True)
    
    if not os.path.exists(src_path):
        print(f"Error: Source file not found: {src_path}")
        continue
        
    try:
        print(f"Loading Keras 3 model from {src_path}...")
        model = tf.keras.models.load_model(src_path)
        print("Model loaded successfully. Summary:")
        model.summary()
        
        # Clean up any existing temp directory
        if os.path.exists(temp_saved_model_dir):
            shutil.rmtree(temp_saved_model_dir)
            
        print("Exporting Keras model as native TF SavedModel...")
        tf.saved_model.save(model, temp_saved_model_dir)
        
        print(f"Converting and saving SavedModel to TFJS in {dest_dir}...")
        tfjs.converters.convert_tf_saved_model(temp_saved_model_dir, dest_dir)
        print(f"Successfully converted {key}!")
        
    except Exception as e:
        print(f"Failed to convert {key}: {str(e)}")
        
    finally:
        # Clean up temp directory
        if os.path.exists(temp_saved_model_dir):
            shutil.rmtree(temp_saved_model_dir)

# Clean up other testing artifacts if they exist
for path in ["test_model.h5", "saved_model_dir", "test_model_tfjs"]:
    p = os.path.join("/home/elon/Documents/Emosense", path)
    if os.path.exists(p):
        if os.path.isdir(p):
            shutil.rmtree(p)
        else:
            os.remove(p)

print("\nAll conversions finished!")
